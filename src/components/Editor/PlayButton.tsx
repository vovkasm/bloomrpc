import { HotkeyConfig, Icon, useHotkeys } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { GRPCEventEmitter, GRPCEventType, GRPCRequest, GRPCWebRequest, ResponseMetaInformation } from '../../behaviour';
import { toaster } from '../../toaster';
import { castToError } from '../../utils';
import type { ControlsStateProps } from './Controls';

export const makeRequest = ({ viewModel, state, protoInfo }: ControlsStateProps) => {
  // Do nothing if not set
  if (!protoInfo) {
    return;
  }

  // Cancel the call if ongoing.
  if (state.loading && state.call) {
    state.call.cancel();
    return;
  }

  // Play button action:
  viewModel.setLoading(true);

  let grpcRequest: GRPCEventEmitter;
  if (state.grpcWeb) {
    grpcRequest = new GRPCWebRequest({
      url: state.url,
      inputs: state.data,
      metadata: state.metadata,
      protoInfo,
      interactive: state.interactive,
      tlsCertificate: state.tlsCertificate,
    });
  } else {
    grpcRequest = new GRPCRequest({
      url: state.url,
      inputs: state.data,
      metadata: state.metadata,
      protoInfo,
      interactive: state.interactive,
      tlsCertificate: state.tlsCertificate,
    });
  }

  viewModel.setCall(grpcRequest);

  // Streaming cleanup
  if (grpcRequest.protoInfo.isClientStreaming()) {
    viewModel.setRequestStreamData(state.interactive ? [state.data] : []);
  }
  viewModel.clearResponseStreamData();

  grpcRequest.on(GRPCEventType.ERROR, (e: Error, metaInfo: ResponseMetaInformation) => {
    viewModel.setResponse({
      responseTime: metaInfo.responseTime,
      output: JSON.stringify({ error: e.message }, null, 2),
    });
  });

  grpcRequest.on(GRPCEventType.DATA, (data: object, metaInfo: ResponseMetaInformation) => {
    if (metaInfo.stream && state.interactive) {
      viewModel.addResponseStreamData({
        output: JSON.stringify(data, null, 2),
        responseTime: metaInfo.responseTime,
      });
    } else {
      viewModel.setResponse({
        responseTime: metaInfo.responseTime,
        output: JSON.stringify(data, null, 2),
      });
    }
  });

  grpcRequest.on(GRPCEventType.END, () => {
    viewModel.setLoading(false);
    viewModel.setCall(undefined);
    viewModel.setStreamCommited(false);
  });

  try {
    grpcRequest.send();
  } catch (mayBeError) {
    const e = castToError(mayBeError);
    console.error(e);
    toaster.show({
      message: `Error constructing the request: ${e.message}`,
      intent: 'danger',
    });
    grpcRequest.emit(GRPCEventType.END);
  }
};

export const PlayButton = observer<ControlsStateProps>(({ viewModel, state, protoInfo, active }) => {
  // TODO(vovkasm): protoInfo created on each render of TabList, so do not add to  deps of useCallback, this will be fixed after
  // introducing models layer
  const run = () => {
    makeRequest({ viewModel, state, protoInfo });
  };

  const hotkeys = React.useMemo<HotkeyConfig[]>(
    () => [
      {
        label: 'Run request',
        combo: 'mod+enter',
        allowInInput: true,
        global: true,
        onKeyDown: () => {
          if (!active || state.loading) return;
          run();
          return false;
        },
      },
    ],
    [],
  );

  useHotkeys(hotkeys);

  return (
    <Icon
      icon={state.loading ? 'pause' : 'play'}
      size={48}
      style={{ ...styles.playIcon, ...(state.loading ? { color: '#ea5d5d' } : {}) }}
      onClick={run}
    />
  );
});

const styles = {
  playIcon: {
    fontSize: 50,
    color: '#28d440',
    cursor: 'pointer',
  },
};
