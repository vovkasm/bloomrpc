import { HotkeyConfig, Tab, Tabs, useHotkeys } from '@blueprintjs/core';
import * as React from 'react';

import { ProtoInfo, ProtoService } from '../../behaviour';
import { Editor, EditorRequest } from '../Editor';
import ss from './TabList.module.scss';

interface TabListProps {
  tabs: TabData[];
  activeKey?: string;
  onChange?: (activeKey: string) => void;
  onDelete?: (activeKey: string) => void;
  onEditorRequestChange?: (requestInfo: EditorTabRequest) => void;
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

export function TabList({ tabs, activeKey, onChange, onDelete, onEditorRequestChange }: TabListProps) {
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
                  protoInfo={new ProtoInfo(tab.service, tab.methodName)}
                  initialRequest={tab.initialRequest}
                  onRequestChange={(editorRequest) => {
                    onEditorRequestChange && onEditorRequestChange({ id: tab.tabKey, ...editorRequest });
                  }}
                />
              }
            />
          );
        })}
      </Tabs>
    </>
  );
}
