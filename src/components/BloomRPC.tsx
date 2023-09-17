import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-protobuf';
import 'ace-builds/src-noconflict/theme-textmate';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ProtoFile, ProtoService, loadProtos } from '../behaviour';
import type { Root } from '../model';
import { useRootModel } from '../model-provider';
import {
  EditorTabsStorage,
  deleteRequestInfo,
  getProtos,
  getRequestInfo,
  getTabs,
  storeProtos,
  storeRequestInfo,
  storeTabs,
} from '../storage';
import { getEnvironments } from '../storage/environments';
import { toaster } from '../toaster';
import { EditorEnvironment } from './Editor';
import { Sidebar } from './Sidebar';
import { TabData, TabList } from './TabList';

export interface EditorTabs {
  activeKey: string;
  tabs: TabData[];
}

export const BloomRPC = observer(() => {
  const root = useRootModel();
  const [protos, setProtosState] = useState<ProtoFile[]>([]);
  const [editorTabs, setEditorTabs] = useState<EditorTabs>({
    activeKey: '0',
    tabs: [],
  });

  const [environments, setEnvironments] = useState<EditorEnvironment[]>(getEnvironments());

  function setTabs(props: EditorTabs | undefined) {
    const localProps = props || { activeKey: '0', tabs: [] };
    setEditorTabs(localProps);
    storeTabs(localProps);
  }

  function setProtos(props: ProtoFile[]) {
    setProtosState(props);
    storeProtos(props);
  }

  // Preload editor with stored data.
  useEffect(() => {
    hydrateEditor(root, setProtos, setTabs);
  }, []);

  return (
    <div style={styles.layout}>
      <aside style={styles.sider}>
        <Sidebar
          protos={protos}
          onProtoUpload={handleProtoUpload(setProtos, protos)}
          onReload={() => {
            hydrateEditor(root, setProtos, setTabs);
          }}
          onMethodSelected={handleMethodSelected(editorTabs, setTabs)}
          onDeleteAll={() => {
            setProtos([]);
          }}
          onMethodDoubleClick={handleMethodDoubleClick(editorTabs, setTabs)}
        />
      </aside>

      <main style={styles.content}>
        <TabList
          tabs={editorTabs.tabs || []}
          activeKey={editorTabs.activeKey}
          environmentList={environments}
          onEnvironmentChange={() => {
            setEnvironments(getEnvironments());
          }}
          onEditorRequestChange={(editorRequestInfo) => {
            storeRequestInfo(editorRequestInfo);
          }}
          onDelete={(activeKey: string) => {
            let newActiveKey = '0';

            const index = editorTabs.tabs.findIndex((tab) => tab.tabKey === activeKey);

            if (index === -1) {
              return;
            }

            if (editorTabs.tabs.length > 1) {
              if (activeKey === editorTabs.activeKey) {
                const newTab = editorTabs.tabs[index - 1] || editorTabs.tabs[index + 1];
                newActiveKey = newTab.tabKey;
              } else {
                newActiveKey = editorTabs.activeKey;
              }
            }

            deleteRequestInfo(activeKey);

            setTabs({
              activeKey: newActiveKey,
              tabs: editorTabs.tabs.filter((tab) => tab.tabKey !== activeKey),
            });
          }}
          onChange={(activeKey: string) => {
            setTabs({
              activeKey,
              tabs: editorTabs.tabs || [],
            });
          }}
        />
      </main>
    </div>
  );
});

/**
 * Hydrate editor from persisted storage
 * @param setProtos
 * @param setEditorTabs
 */
async function hydrateEditor(
  root: Root,
  setProtos: React.Dispatch<ProtoFile[]>,
  setEditorTabs: React.Dispatch<EditorTabs>,
): Promise<void> {
  const tasks: Array<Promise<boolean>> = [];
  const savedProtos = getProtos();

  if (savedProtos) {
    tasks.push(loadProtos(savedProtos, root.importPaths.paths, handleProtoUpload(setProtos, [])).then(() => true));

    const savedEditorTabs = getTabs();
    if (savedEditorTabs) {
      const task = async () => {
        try {
          const tabs = await loadTabs(root, savedEditorTabs);
          setEditorTabs(tabs);
        } catch (_) {
          setEditorTabs({ activeKey: '0', tabs: [] });
        }
        return true;
      };
      tasks.push(task());
    }
  }

  return Promise.all(tasks).then();
}

/**
 * Load tabs
 * @param editorTabs
 */
async function loadTabs(root: Root, editorTabs: EditorTabsStorage): Promise<EditorTabs> {
  const storedEditTabs: EditorTabs = {
    activeKey: editorTabs.activeKey,
    tabs: [],
  };

  const protos = await loadProtos(
    editorTabs.tabs.map((tab) => {
      return tab.protoPath;
    }),
    root.importPaths.paths,
  );

  const previousTabs = editorTabs.tabs.map((tab) => {
    const def = protos.find((protoFile) => {
      const match = Object.keys(protoFile.services).find((service) => service === tab.serviceName);
      return Boolean(match);
    });

    // Old Definition Not found
    if (!def) {
      return false;
    }

    return {
      tabKey: tab.tabKey,
      methodName: tab.methodName,
      service: def.services[tab.serviceName],
      initialRequest: getRequestInfo(tab.tabKey),
    };
  });

  storedEditTabs.tabs = previousTabs.filter((tab) => tab) as TabData[];

  return storedEditTabs;
}

/**
 *
 * @param setProtos
 * @param protos
 */
function handleProtoUpload(setProtos: React.Dispatch<ProtoFile[]>, protos: ProtoFile[]) {
  return function (newProtos: ProtoFile[], err: Error | void) {
    if (err) {
      toaster.show({
        intent: 'danger',
        message: `Error while importing protos: ${err.message}`,
        icon: 'cross-circle',
      });
      setProtos([]);
      return;
    }

    const protoMinusExisting = protos.filter((proto) => {
      return !newProtos.find((p) => p.fileName === proto.fileName);
    });

    const appProtos = [...protoMinusExisting, ...newProtos];
    setProtos(appProtos);

    return appProtos;
  };
}

/**
 * Handle method selected
 * @param editorTabs
 * @param setTabs
 */
function handleMethodSelected(editorTabs: EditorTabs, setTabs: React.Dispatch<EditorTabs>) {
  return (methodName: string, protoService: ProtoService) => {
    const tab = {
      tabKey: `${protoService.serviceName}${methodName}`,
      methodName,
      service: protoService,
    };

    const tabExists = editorTabs.tabs.find((exisingTab) => exisingTab.tabKey === tab.tabKey);

    if (tabExists) {
      setTabs({
        activeKey: tab.tabKey,
        tabs: editorTabs.tabs,
      });
      return;
    }

    const newTabs = [...editorTabs.tabs, tab];

    setTabs({
      activeKey: tab.tabKey,
      tabs: newTabs,
    });
  };
}

function handleMethodDoubleClick(editorTabs: EditorTabs, setTabs: React.Dispatch<EditorTabs>) {
  return (methodName: string, protoService: ProtoService) => {
    const tab = {
      tabKey: `${protoService.serviceName}${methodName}-${uuidv4()}`,
      methodName,
      service: protoService,
    };

    const newTabs = [...editorTabs.tabs, tab];

    setTabs({
      activeKey: tab.tabKey,
      tabs: newTabs,
    });
  };
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    flexDirection: 'row',
  },
  sider: {
    width: '300px',
    zIndex: 20,
    borderRight: '1px solid rgba(0, 21, 41, 0.18)',
    backgroundColor: 'white',
    boxShadow: '3px 0px 4px 0px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
  },
} as const;
