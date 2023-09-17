import {
  AnchorButton,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  InputGroup,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Tooltip,
  Tree,
  TreeNodeInfo,
} from '@blueprintjs/core';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { OnProtoUpload, ProtoFile, ProtoService, importProtos, importResolvePath } from '../../behaviour';
import { getImportPaths } from '../../storage';
import { strcmp } from '../../utils';
import { Badge } from '../Badge/Badge';
import { PathResolution, addImportPath } from './PathResolution';

interface SidebarProps {
  protos: ProtoFile[];
  onMethodSelected: (methodName: string, protoService: ProtoService) => void;
  onProtoUpload: OnProtoUpload;
  onDeleteAll: () => void;
  onReload: () => void;
  onMethodDoubleClick: (methodName: string, protoService: ProtoService) => void;
}

export function Sidebar({
  protos,
  onMethodSelected,
  onProtoUpload,
  onDeleteAll,
  onReload,
  onMethodDoubleClick,
}: SidebarProps) {
  const [importPaths, setImportPaths] = useState<string[]>(['']);
  const [importPathVisible, setImportPathsVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterMatch, setFilterMatch] = useState<string | undefined>(undefined);

  useEffect(() => {
    setImportPaths(getImportPaths());
  }, []);

  /**
   * An internal function to retrieve protobuff from the selected key
   * @param selected The selected key from the directory tree
   */
  function processSelectedKey(selected: string | undefined) {
    // We handle only methods.
    if (!selected || !selected.includes('method:')) {
      return undefined;
    }

    const fragments = selected.split('||');
    const fileName = fragments[0];
    const methodName = fragments[1].replace('method:', '');
    const serviceName = fragments[2].replace('service:', '');

    const protodef = protos.find((protoFile) => {
      const match = Object.keys(protoFile.services).find(
        (service) => service === serviceName && fileName === protoFile.services[serviceName].proto.filePath,
      );
      return Boolean(match);
    });

    if (!protodef) {
      return undefined;
    }
    return { methodName, protodef, serviceName };
  }

  function toggleFilter() {
    setFilterVisible(!filterVisible);
    if (filterVisible) {
      setFilterMatch(undefined);
    }
  }

  return (
    <>
      <Navbar className="bp5-dark">
        <NavbarGroup>
          <NavbarHeading>Protos</NavbarHeading>
          <Tooltip content="Import proto definitions" placement="bottom">
            <Button intent="primary" icon="plus" onClick={() => importProtos(onProtoUpload, importPaths)} />
          </Tooltip>
          <NavbarDivider />
          <Tooltip content="Reload" placement="bottom">
            <Button icon="refresh" minimal onClick={onReload} />
          </Tooltip>
          <Tooltip content="Import Paths" placement="bottom">
            <Button icon="array" minimal onClick={() => setImportPathsVisible(true)} />
          </Tooltip>
          <Tooltip content="Filter method names" placement="bottom">
            <AnchorButton icon="filter" minimal onClick={() => toggleFilter()} />
          </Tooltip>
        </NavbarGroup>
        <NavbarGroup align="right">
          <Tooltip content="Delete all" placement="bottom">
            <Button icon="trash" minimal intent="danger" onClick={onDeleteAll} />
          </Tooltip>
        </NavbarGroup>
      </Navbar>
      <Dialog
        title="Import Paths"
        icon="folder-new"
        isOpen={importPathVisible}
        onClose={() => setImportPathsVisible(false)}
      >
        <DialogBody>
          <PathResolution onImportsChange={setImportPaths} importPaths={importPaths} />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button
                text="Add"
                intent="primary"
                onClick={async () => {
                  const path = await importResolvePath();
                  if (!path) return;
                  addImportPath(path, importPaths, setImportPaths);
                }}
              />
              <Button text="Close" onClick={() => setImportPathsVisible(false)} />
            </>
          }
        />
      </Dialog>

      <div style={{ flex: 1, overflowY: 'scroll' }}>
        <InputGroup
          placeholder={'Filter methods'}
          hidden={!filterVisible}
          onChange={(v) => setFilterMatch(v.target.value || undefined)}
        />
        {protos.length > 0 ? (
          <Tree
            contents={getTreeData(protos, filterMatch)}
            onNodeClick={async (node) => {
              const nodeData = node.nodeData;
              if (!nodeData) return;
              onMethodSelected(nodeData.methodName, nodeData.protoFile.services[nodeData.serviceName]);
            }}
            onNodeDoubleClick={async (node) => {
              const nodeData = node.nodeData;
              if (!nodeData) return;
              onMethodDoubleClick(nodeData.methodName, nodeData.protoFile.services[nodeData.serviceName]);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

type TreeNodeData =
  | {
      type: 'method';
      methodName: string;
      serviceName: string;
      protoFile: ProtoFile;
    }
  | undefined;

function getTreeData(protos: ProtoFile[], filterMatch: string | undefined): TreeNodeInfo<TreeNodeData>[] {
  return protos
    .sort((a, b) => strcmp(a.fileName, b.fileName))
    .map((proto) => ({
      id: proto.fileName,
      icon: <Badge type="protoFile">P</Badge>,
      label: proto.fileName,
      isExpanded: true,
      childNodes: Object.keys(proto.services)
        .sort((a, b) => strcmp(a, b))
        .map((service) => ({
          id: `${proto.fileName}-service:${service}`,
          icon: <Badge type="service">S</Badge>,
          label: service,
          isExpanded: true,
          childNodes: proto.services[service].methodsName
            .sort((a, b) => strcmp(a, b))
            .filter((name) => {
              if (!filterMatch) return true;
              return name.toLowerCase().includes(filterMatch.toLowerCase());
            })
            .map((method: any) => ({
              id: `${proto.proto.filePath}||method:${method}||service:${service}`,
              icon: <Badge type="method">M</Badge>,
              label: method,
              nodeData: {
                type: 'method',
                methodName: method,
                serviceName: service,
                protoFile: proto,
              },
            })),
        })),
    }));
}
