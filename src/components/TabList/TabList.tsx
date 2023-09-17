import * as React from 'react';
import { HotkeyConfig, Tab, Tabs, useHotkeys } from '@blueprintjs/core';

import { Editor, EditorEnvironment, EditorRequest } from '../Editor';
import { ProtoInfo, ProtoService } from '../../behaviour';
import ss from './TabList.module.scss';

interface TabListProps {
  tabs: TabData[];
  activeKey?: string;
  onChange?: (activeKey: string) => void;
  onDelete?: (activeKey: string) => void;
  onEditorRequestChange?: (requestInfo: EditorTabRequest) => void;
  environmentList?: EditorEnvironment[];
  onEnvironmentChange?: () => void;
}

export interface TabData {
  tabKey: string;
  methodName: string;
  service: ProtoService;
  initialRequest?: EditorRequest;
}

export interface EditorTabRequest extends EditorRequest {
  id: string;
}

export function TabList({
  tabs,
  activeKey,
  onChange,
  onDelete,
  onEditorRequestChange,
  environmentList,
  onEnvironmentChange,
}: TabListProps) {
  const tabsWithMatchingKey = tabs.filter((tab) => tab.tabKey === activeKey);

  const tabActiveKey =
    tabsWithMatchingKey.length === 0
      ? [...tabs.map((tab) => tab.tabKey)].pop()
      : [...tabsWithMatchingKey.map((tab) => tab.tabKey)].pop();

  const hotkeys = React.useMemo<HotkeyConfig[]>(
    () => [
      {
        label: 'Close current tab',
        combo: 'mod+w',
        global: true,
        preventDefault: true,
        onKeyDown: () => {
          if (tabActiveKey) {
            onDelete && onDelete(tabActiveKey);
          }
          return false;
        },
      },
    ],
    [tabActiveKey, onDelete],
  );

  useHotkeys(hotkeys);

  return (
    <>
      <Tabs className={ss.mainTabs} selectedTabId={tabActiveKey} onChange={onChange} animate={false}>
        {tabs.map((tab, index) => {
          return (
            <Tab
              id={tab.tabKey}
              key={tab.tabKey}
              title={`${tab.service.serviceName}.${tab.methodName}`}
              panel={
                <Editor
                  key={tab.tabKey}
                  active={tab.tabKey === activeKey}
                  environmentList={environmentList}
                  protoInfo={new ProtoInfo(tab.service, tab.methodName)}
                  initialRequest={tab.initialRequest}
                  onEnvironmentListChange={onEnvironmentChange}
                  onRequestChange={(editorRequest) => {
                    onEditorRequestChange && onEditorRequestChange({ id: tab.tabKey, ...editorRequest });
                  }}
                />
              }
            />
          );
        })}
      </Tabs>
      {/* <AntTabs
      className={"draggable-tabs"}
      onEdit={(targetKey, action) => {
        if (action === "remove" && typeof targetKey === 'string') {
          onDelete && onDelete(targetKey);
        }
      }}
      onChange={onChange}
      tabBarStyle={styles.tabBarStyle}
      style={styles.tabList}
      activeKey={tabActiveKey || "0"}
      hideAdd
      type="editable-card"
      renderTabBar={(props, DefaultTabBar: any) => {
        return (
            <DraggableTabs
                onSortEnd={onDragEnd}
                lockAxis={"x"}
                axis={"x"}
                pressDelay={120}
                helperClass={"draggable draggable-tab"}
            >
              <DefaultTabBar {...props}>
                {(node: any) => {
                  const nodeIndex = tabs.findIndex(tab => tab.tabKey === node.key);
                  const nodeTab = tabs.find(tab => tab.tabKey === node.key);
                  return (
                      <DraggableItem
                          active={nodeTab && nodeTab.tabKey === activeKey}
                          index={nodeIndex}
                          key={node.key}
                      >
                        {node}
                      </DraggableItem>
                  )
                }}
              </DefaultTabBar>
            </DraggableTabs>
        )
      }}
    >
      {tabs.length === 0 ? (
        <AntTabs.TabPane
          tab={"New Tab"}
          key={"0"}
          closable={false}
          style={{ height: "100%" }}
        >
          <Editor
            active={true}
            environmentList={environmentList}
            onEnvironmentListChange={onEnvironmentChange}
          />
        </AntTabs.TabPane>
      ) : tabs.map((tab) => (
          <AntTabs.TabPane
            tab={`${tab.service.serviceName}.${tab.methodName}`}
            key={tab.tabKey}
            closable={true}
            style={{ height: "100%" }}
          >
            <Editor
              active={tab.tabKey === activeKey}
              environmentList={environmentList}
              protoInfo={new ProtoInfo(tab.service, tab.methodName)}
              key={tab.tabKey}
              initialRequest={tab.initialRequest}
              onEnvironmentListChange={onEnvironmentChange}
              onRequestChange={(editorRequest: EditorRequest) => {
                onEditorRequestChange && onEditorRequestChange({
                  id: tab.tabKey,
                  ...editorRequest
                })
              }}
            />
          </AntTabs.TabPane>
      ))}
    </AntTabs> */}
    </>
  );
}

// const styles = {
//   tabList: {
//     height: "100%"
//   },
//   tabBarStyle: {
//     padding: "10px 0px 0px 20px",
//     marginBottom: "0px",
//   }
// };
