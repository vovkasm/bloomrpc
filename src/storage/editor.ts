// @ts-ignore
import Store from 'electron-store';

import type { ProtoFile } from '../behaviour';
import type { EditorTabs } from '../components/BloomRPC';
import type { EditorRequest } from '../components/Editor';
import type { EditorTabRequest } from '../components/TabList';

type EditorStorage = {
  protos: string[];
  tabs: EditorTabsStorage;
  requests: TabRequestInfo[];
};

const EditorStore = new Store<EditorStorage>({
  name: 'editor',
});

const KEYS = {
  PROTOS: 'protos',
  TABS: 'tabs',
  REQUESTS: 'requests',
  INTERACTIVE: 'interactive',
} as const;

/**
 * Store Proto List on the sidebar
 * @param protos
 */
export function storeProtos(protos: ProtoFile[]) {
  EditorStore.set(
    KEYS.PROTOS,
    protos.map((proto) => proto.proto.filePath),
  );
}

/**
 * Get proto list
 */
export function getProtos(): string[] | undefined {
  return EditorStore.get(KEYS.PROTOS);
}

/**
 * Store tabs
 * @param editorTabs
 */
export function storeTabs(editorTabs: EditorTabs) {
  EditorStore.set(KEYS.TABS, {
    activeKey: editorTabs.activeKey,
    tabs: editorTabs.tabs.map((tab) => ({
      methodName: tab.methodName,
      serviceName: tab.service.serviceName,
      protoPath: tab.service.proto.filePath,
      tabKey: tab.tabKey,
    })),
  });
}

export interface EditorTabsStorage {
  activeKey: string;
  tabs: {
    protoPath: string;
    methodName: string;
    serviceName: string;
    tabKey: string;
  }[];
}

/**
 * Get tabs
 */
export function getTabs(): EditorTabsStorage | undefined {
  return EditorStore.get(KEYS.TABS);
}

interface TabRequestInfo extends EditorRequest {
  id: string;
}

/**
 * Store editor request info
 * @param id
 * @param url
 * @param data
 * @param inputs
 * @param metadata
 * @param interactive
 * @param tlsCertificate
 */
export function storeRequestInfo({
  id,
  url,
  data,
  metadata,
  interactive,
  tlsCertificate,
  environment,
  grpcWeb,
}: EditorTabRequest) {
  const request = {
    id,
    url,
    data,
    metadata,
    interactive,
    tlsCertificate,
    environment,
    grpcWeb,
    createdAt: new Date().toISOString(),
  };

  const requestList = EditorStore.get('requests', []).filter((requestItem: TabRequestInfo) => requestItem.id !== id);

  EditorStore.set(KEYS.REQUESTS, [...requestList, request]);
}

/**
 * Get editor request info
 * @param tabKey
 */
export function getRequestInfo(tabKey: string): EditorRequest | undefined {
  const requests = EditorStore.get(KEYS.REQUESTS, []);
  return requests.find((request: TabRequestInfo) => request.id === tabKey);
}

/**
 * Delete editor request info
 * @param tabKey
 */
export function deleteRequestInfo(tabKey: string) {
  const requests = EditorStore.get(KEYS.REQUESTS, []).filter(
    (requestItem: TabRequestInfo) => requestItem.id !== tabKey,
  );

  EditorStore.set('requests', requests);
}

export function clearEditor() {
  EditorStore.clear();
}

export { EditorStore };
