import { Icon, Tooltip } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import type { ProtoInfo } from '../../behaviour';
import type { EditorViewModel } from './Editor';
import { PlayButton } from './PlayButton';

export interface ControlsStateProps {
  viewModel: EditorViewModel;
  protoInfo?: ProtoInfo;
  active?: boolean;
}

export const Controls = observer<ControlsStateProps>(({ viewModel, protoInfo, active }) => {
  return (
    <div>
      <PlayButton viewModel={viewModel} active={active} protoInfo={protoInfo} />

      {viewModel.isControlVisible && (
        <div style={styles.controlsContainer}>
          <Tooltip placement="top-start" content="Push Data">
            <div
              style={styles.pushData}
              onClick={() => {
                if (viewModel.call) {
                  viewModel.addRequestStreamData(viewModel.data);
                  viewModel.call.write(viewModel.data);
                }
              }}
            >
              <Icon icon="double-chevron-right" />
            </div>
          </Tooltip>

          <Tooltip placement="top-end" content="Commit Stream">
            <div
              style={styles.commit}
              onClick={() => {
                if (viewModel.call) {
                  viewModel.call.commitStream();
                  viewModel.setStreamCommited(true);
                }
              }}
            >
              <Icon icon="tick" />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

const styles = {
  controlsContainer: {
    display: 'flex',
    marginLeft: '-15px',
    marginTop: 17,
  },
  pushData: {
    background: '#11c9f3',
    color: 'white',
    padding: '10px',
    paddingLeft: '12px',
    borderRadius: '50% 0 0 50%',
    fontSize: '18px',
    cursor: 'pointer',
    border: '2px solid rgb(238, 238, 238)',
    borderRight: 'none',
  },
  commit: {
    background: '#28d440',
    color: 'white',
    padding: '10px',
    paddingLeft: '12px',
    borderRadius: '0 50% 50% 0',
    fontSize: '18px',
    cursor: 'pointer',
    border: '2px solid rgb(238, 238, 238)',
    borderLeft: 'none',
  },
};
