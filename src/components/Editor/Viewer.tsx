import * as React from 'react';
import AceEditor from 'react-ace';
import { HotkeyConfig, useHotkeys } from '@blueprintjs/core';

interface ResponseProps {
  output: string;
  responseTime?: number;
  emptyContent?: Node | Element | JSX.Element;
}

export function Viewer({ output, responseTime, emptyContent }: ResponseProps) {
  const editorRef = React.useRef<AceEditor>(null);
  const inputSearch = React.useRef<HTMLInputElement>(null);
  const [showFind, setShowFind] = React.useState(false);

  const doShowFind = React.useCallback(() => {
    const nextShowFind = !showFind;
    setShowFind(nextShowFind);
    if (nextShowFind) {
      inputSearch.current?.focus();
    }
  }, [showFind, setShowFind, inputSearch]);

  const hotkeys = React.useMemo<HotkeyConfig[]>(
    () => [
      {
        label: 'Toggle response search',
        combo: 'mod+f',
        allowInInput: true,
        global: true,
        onKeyDown: () => {
          doShowFind();
          return false;
        },
      },
    ],
    [doShowFind],
  );

  useHotkeys(hotkeys);

  return (
    <div style={styles.responseContainer}>
      <input
        ref={inputSearch}
        name="search"
        className={`bp5-input find-match ${!showFind ? 'hide' : ''}`}
        placeholder={'Search match'}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          editorRef.current?.editor.findAll(e.target.value, {
            backwards: false,
            wrap: true,
            caseSensitive: false,
            wholeWord: false,
            regExp: true,
          });
        }}
      />

      {!output && emptyContent}

      {responseTime && <div style={styles.responseTime}>{responseTime.toFixed(3)}s</div>}

      {output && (
        <AceEditor
          ref={editorRef}
          className={'response-edit'}
          style={{ background: '#fff' }}
          width={'100%'}
          height={'calc(100vh - 188px)'}
          mode="json"
          theme="textmate"
          name="output"
          fontSize={13}
          showPrintMargin={false}
          wrapEnabled
          showGutter
          readOnly
          highlightActiveLine={false}
          value={output}
          onLoad={(editor: any) => {
            editor.renderer.$cursorLayer.element.style.display = 'none';
            editor.$blockScrolling = Infinity;
          }}
          commands={[
            {
              name: 'find',
              bindKey: { win: 'Ctrl-f', mac: 'Command-f' }, //key combination used for the command.
              exec: () => doShowFind(),
            },
          ]}
          setOptions={{
            useWorker: false,
            showLineNumbers: false,
            highlightGutterLine: false,
            fixedWidthGutter: true,
            tabSize: 1,
            displayIndentGuides: false,
          }}
        />
      )}
    </div>
  );
}

const styles = {
  responseContainer: {
    background: 'white',
    position: 'relative' as 'relative',
  },
  responseTime: {
    userSelect: 'none' as 'none',
    fontSize: 11,
    padding: '3px 7px',
    background: '#f3f6f7',
    position: 'absolute' as 'absolute',
    top: '5px',
    right: '0px',
    zIndex: 30,
  },
};
