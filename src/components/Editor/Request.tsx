import { Tab, Tabs } from '@blueprintjs/core';
import * as React from 'react';
import AceEditor, { ICommand } from 'react-ace';

import { Viewer } from './Viewer';

interface RequestProps {
  data: string;
  streamData: string[];
  onChangeData: (value: string) => void;
  commands?: ICommand[];
  active?: boolean;
}

export function Request({ onChangeData, commands, data, streamData, active }: RequestProps) {
  const editorTabKey = `editorTab`;

  // bind esc for focus on the active editor window
  const aceEditor = React.useRef<AceEditor>(null);
  // React.useEffect(() => {
  //   if (active) {
  //     Mousetrap.bindGlobal('esc', () => {
  //       const node = aceEditor.current as any
  //       if (node && 'editor' in node) {
  //         node.editor.focus()
  //       }
  //     })
  //   }
  // })

  return (
    <>
      <Tabs id="request-tabs" defaultSelectedTabId={editorTabKey}>
        <Tab
          id={editorTabKey}
          key={editorTabKey}
          title="Editor"
          panel={
            <AceEditor
              ref={aceEditor}
              style={{ background: '#fff' }}
              width={'100%'}
              height={'calc(100vh - 185px)'}
              mode="json"
              theme="textmate"
              name="inputs"
              fontSize={13}
              cursorStart={2}
              onChange={onChangeData}
              commands={commands}
              showPrintMargin={false}
              showGutter
              highlightActiveLine={false}
              value={data}
              setOptions={{
                useWorker: false,
                displayIndentGuides: true,
              }}
              tabSize={2}
            />
          }
          panelClassName="bl-editor-tab-panel"
        />

        {streamData.map((data, key) => (
          <Tab id={`${key}`} key={`${key}`} title={`Stream ${key + 1}`} panel={<Viewer output={data} />} />
        ))}
      </Tabs>
    </>
  );
}
