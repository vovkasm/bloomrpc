import { Icon } from '@blueprintjs/core';
import { Resizable } from 're-resizable';
import * as React from 'react';
import { useState } from 'react';
import AceEditor from 'react-ace';

import { storeMetadata } from '../../storage';

interface MetadataProps {
  onMetadataChange: (value: string) => void;
  value: string;
}

const minHeight = 32;

export function Metadata({ onMetadataChange, value }: MetadataProps) {
  const [height, setHeight] = useState(minHeight);
  const visibile = height > minHeight;

  return (
    <Resizable
      size={{ width: '100%', height: height }}
      maxHeight={500}
      minHeight={minHeight}
      enable={{
        top: true,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResizeStop={(e, direction, ref, d) => {
        setHeight(height + d.height);
      }}
      className="meatada-panel"
      style={{ ...styles.optionContainer, ...{ bottom: `-${minHeight}px`, height: `${height}px` } }}
    >
      <div>
        <div style={styles.optionLabel}>
          <a
            href={'#'}
            style={styles.optionLink}
            onClick={() => {
              if (visibile) {
                setHeight(minHeight);
              } else {
                setHeight(150);
              }
            }}
          >
            {' '}
            {visibile ? <Icon icon="chevron-down" /> : <Icon icon="chevron-up" />} METADATA{' '}
          </a>
        </div>

        <div>
          <AceEditor
            width={'100%'}
            style={{ background: '#f5f5f5' }}
            height={`${height + 20}px`}
            mode="json"
            focus={visibile}
            theme="textmate"
            fontSize={13}
            name="metadata"
            onChange={(value) => {
              storeMetadata(value);
              onMetadataChange(value);
            }}
            showPrintMargin={false}
            showGutter
            highlightActiveLine={false}
            value={value}
            setOptions={{
              useWorker: false,
            }}
          />
        </div>
      </div>
    </Resizable>
  );
}

const styles = {
  optionLabel: {
    background: '#001529',
    padding: '7px 10px',
    marginBottom: '5px',
  },
  optionContainer: {
    position: 'absolute',
    fontWeight: 900,
    fontSize: '13px',
    borderLeft: '1px solid rgba(0, 21, 41, 0.18)',
    background: '#f5f5f5',
    zIndex: 10,
  },
  optionLink: {
    color: '#fff',
    textDecoration: 'none',
  },
} as const;
