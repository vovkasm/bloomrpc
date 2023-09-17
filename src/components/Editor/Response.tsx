import { Tab, Tabs } from '@blueprintjs/core';
import * as React from 'react';

import bluePng from '../../../resources/blue/128x128.png';
import { EditorResponse } from './Editor';
import { Viewer } from './Viewer';

interface ResponseProps {
  streamResponse: EditorResponse[];
  response: EditorResponse;
}

export function Response({ response, streamResponse }: ResponseProps) {
  const defaultKey = `responseTab`;
  return (
    <>
      <Tabs id="response-tabs" defaultSelectedTabId={defaultKey} className="bl-editor-tabs">
        {streamResponse.length === 0 && (
          <Tab
            title={'Response'}
            id={defaultKey}
            key={defaultKey}
            panel={
              <Viewer
                output={response.output}
                responseTime={response.responseTime}
                emptyContent={
                  <div style={{ position: 'relative', height: '325px' }}>
                    <div style={styles.introContainer}>
                      <img src={bluePng} style={{ opacity: 0.1, pointerEvents: 'none', userSelect: 'none' }} />
                      <h1 style={styles.introTitle}>Hit the play button to get a response here</h1>
                    </div>
                  </div>
                }
              />
            }
            panelClassName="bl-editor-tab-panel"
          />
        )}
        {streamResponse.map((data, key) => (
          <Tab
            title={`Stream ${key + 1}`}
            id={`response-${key}`}
            key={`response-${key}`}
            panel={<Viewer output={data.output} responseTime={data.responseTime} />}
            panelClassName="bl-editor-tab-panel"
          />
        ))}
      </Tabs>
    </>
  );
}

const styles = {
  introContainer: {
    textAlign: 'center' as 'center',
    margin: '20% 30% auto',
    width: '45%',
    position: 'absolute' as 'absolute',
    zIndex: 7,
  },
  introTitle: {
    userSelect: 'none' as 'none',
    color: 'rgba(17, 112, 134, 0.58)',
    fontSize: '25px',
    top: '120px',
  },
};
