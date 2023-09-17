import * as React from 'react';
import { EditorAction, EditorState } from './Editor';
import { PlayButton } from './PlayButton';
import { setRequestStreamData, setStreamCommitted } from './actions';
import { ProtoInfo } from '../../behaviour';
import { Icon, Tooltip } from '@blueprintjs/core';

export interface ControlsStateProps {
  dispatch: React.Dispatch<EditorAction>;
  state: EditorState;
  protoInfo?: ProtoInfo;
  active?: boolean;
}

export function Controls({ dispatch, state, protoInfo, active }: ControlsStateProps) {
  return (
    <div>
      <PlayButton active={active} dispatch={dispatch} state={state} protoInfo={protoInfo} />

      {isControlVisible(state) && (
        <div style={styles.controlsContainer}>
          <Tooltip placement="top-start" content="Push Data">
            <div
              style={styles.pushData}
              onClick={() => {
                if (state.call) {
                  dispatch(setRequestStreamData([...state.requestStreamData, state.data]));
                  state.call.write(state.data);
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
                if (state.call) {
                  state.call.commitStream();
                  dispatch(setStreamCommitted(true));
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
}

export function isControlVisible(state: EditorState) {
  return Boolean(
    state.interactive &&
      state.loading &&
      state.call &&
      state.call.protoInfo.isClientStreaming() &&
      !state.streamCommitted,
  );
}

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
