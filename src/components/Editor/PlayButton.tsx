import { HotkeyConfig, Icon, useHotkeys } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { GRPCEventEmitter, GRPCEventType, GRPCRequest, GRPCWebRequest, ResponseMetaInformation } from '../../behaviour';
import { toaster } from '../../toaster';
import { castToError } from '../../utils';
import type { ControlsStateProps } from './Controls';

export const makeRequest = ({ viewModel, protoInfo }: ControlsStateProps) => {
  // Do nothing if not set
  if (!protoInfo) {
    return;
  }

  // Cancel the call if ongoing.
  if (viewModel.loading && viewModel.call) {
    viewModel.call.cancel();
    return;
  }

  // Play button action:
  viewModel.setLoading(true);

  let grpcRequest: GRPCEventEmitter;
  if (viewModel.grpcWeb) {
    grpcRequest = new GRPCWebRequest({
      url: viewModel.url,
      inputs: viewModel.data,
      metadata: viewModel.metadata,
      protoInfo,
      interactive: viewModel.interactive,
      tlsCertificate: viewModel.tlsCertificate,
    });
  } else {
    grpcRequest = new GRPCRequest({
      url: viewModel.url,
      inputs: viewModel.data,
      metadata: viewModel.metadata,
      protoInfo,
      interactive: viewModel.interactive,
      tlsCertificate: viewModel.tlsCertificate,
    });
  }

  viewModel.setCall(grpcRequest);

  // Streaming cleanup
  if (grpcRequest.protoInfo.isClientStreaming()) {
    viewModel.setRequestStreamData(viewModel.interactive ? [viewModel.data] : []);
  }
  viewModel.clearResponseStreamData();

  grpcRequest.on(GRPCEventType.ERROR, (e: Error, metaInfo: ResponseMetaInformation) => {
    viewModel.setResponse({
      responseTime: metaInfo.responseTime,
      output: JSON.stringify({ error: e.message }, null, 2),
    });
  });

  grpcRequest.on(GRPCEventType.DATA, (data: object, metaInfo: ResponseMetaInformation) => {
    if (metaInfo.stream && viewModel.interactive) {
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

export const PlayButton = observer<ControlsStateProps>(({ viewModel, protoInfo, active }) => {
  // TODO(vovkasm): protoInfo created on each render of TabList, so do not add to  deps of useCallback, this will be fixed after
  // introducing models layer
  const run = () => {
    makeRequest({ viewModel, protoInfo });
  };

  const hotkeys = React.useMemo<HotkeyConfig[]>(
    () => [
      {
        label: 'Run request',
        combo: 'mod+enter',
        allowInInput: true,
        global: true,
        onKeyDown: () => {
          if (!active || viewModel.loading) return;
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
      icon={viewModel.loading ? 'pause' : 'play'}
      size={48}
      style={{ ...styles.playIcon, ...(viewModel.loading ? { color: '#ea5d5d' } : {}) }}
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
