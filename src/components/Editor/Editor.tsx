import { makeAutoObservable, observable } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import * as React from 'react';
import { useEffect, useReducer } from 'react';

import { GRPCEventEmitter, ProtoInfo } from '../../behaviour';
import { exportResponseToJSONFile } from '../../behaviour/response';
import type { Certificate } from '../../model';
import { useRootModel } from '../../model-provider';
import { getMetadata, getUrl, storeUrl } from '../../storage';
import { AddressBar } from './AddressBar';
import { Controls, isControlVisible } from './Controls';
import { Metadata } from './Metadata';
import { Options } from './Options';
import { ProtoFileViewer } from './ProtoFileViewer';
import { Request } from './Request';
import { Response } from './Response';
import { actions, setMetadataVisibilty, setProtoVisibility } from './actions';

export interface EditorAction {
  [key: string]: any;
  type: string;
}

export interface EditorEnvironment {
  name: string;
  url: string;
  metadata: string;
  interactive: boolean;
  tlsCertificate: Certificate;
}

export interface EditorRequest {
  url: string;
  data: string;
  inputs?: string; // @deprecated
  metadata: string;
  interactive: boolean;
  environment?: string;
  grpcWeb: boolean;
  tlsCertificate?: Certificate;
}

export interface EditorState {
  url: string;
  data: string;
  inputs?: string; // @deprecated
  metadata: string;
  interactive: boolean;
  environment?: string;
  grpcWeb: boolean;
  tlsCertificate?: Certificate;

  loading: boolean;
  response: EditorResponse;
  metadataOpened: boolean;
  protoViewVisible: boolean;
  requestStreamData: string[];
  responseStreamData: EditorResponse[];
  streamCommitted: boolean;
  call?: GRPCEventEmitter;
}

interface EditorOldState {
  loading: boolean;
  response: EditorResponse;
  metadataOpened: boolean;
  protoViewVisible: boolean;
  requestStreamData: string[];
  responseStreamData: EditorResponse[];
  streamCommitted: boolean;
  call?: GRPCEventEmitter;
}

export interface EditorProps {
  protoInfo?: ProtoInfo;
  onRequestChange?: (editorRequest: EditorRequest & EditorState) => void;
  initialRequest?: EditorRequest;
  active?: boolean;
}

export interface EditorResponse {
  output: string;
  responseTime?: number;
}

const INITIAL_STATE: EditorOldState = {
  requestStreamData: [],
  responseStreamData: [],
  loading: false,
  response: {
    output: '',
    responseTime: undefined,
  },
  metadataOpened: false,
  protoViewVisible: false,
  streamCommitted: false,
  call: undefined,
};

/**
 * Reducer
 * @param state
 * @param action
 */
const reducer = (state: EditorOldState, action: EditorAction): EditorOldState => {
  switch (action.type) {
    case actions.SET_IS_LOADING:
      return { ...state, loading: action.isLoading };

    case actions.SET_RESPONSE:
      return { ...state, response: action.response };

    case actions.SET_CALL:
      return { ...state, call: action.call };

    case actions.SET_METADATA_VISIBILITY:
      return { ...state, metadataOpened: action.visible };

    case actions.SET_PROTO_VISIBILITY:
      return { ...state, protoViewVisible: action.visible };

    case actions.SET_REQUEST_STREAM_DATA:
      return { ...state, requestStreamData: action.requestData };

    case actions.SET_RESPONSE_STREAM_DATA:
      return { ...state, responseStreamData: action.responseData };

    case actions.ADD_RESPONSE_STREAM_DATA:
      return { ...state, responseStreamData: [...state.responseStreamData, action.responseData] };

    case actions.SET_STREAM_COMMITTED:
      return { ...state, streamCommitted: action.committed };

    default:
      return state;
  }
};

type EditorViewModelInit = {
  url: string;
  interactive: boolean;
  metadata: string;
  grpcWeb: boolean;
  environmentName?: string;
};

export class EditorViewModel {
  url: string;
  interactive: boolean;
  metadata: string;
  grpcWeb: boolean;
  environmentName: string | undefined;
  data: string = '';
  tlsCertificate?: Certificate = undefined;

  constructor(init: EditorViewModelInit) {
    this.url = init.url;
    this.interactive = init.interactive;
    this.metadata = init.metadata;
    this.grpcWeb = init.grpcWeb;
    this.environmentName = init.environmentName;
    makeAutoObservable(this, { tlsCertificate: observable.ref });
  }

  setUrl(url: string) {
    this.url = url;
  }

  setInteractive(val: boolean) {
    this.interactive = val;
  }

  setMetadata(val: string) {
    this.metadata = val;
  }

  setGrpcWeb(val: boolean) {
    this.grpcWeb = val;
  }

  setEnvironmentName(val: string | undefined) {
    this.environmentName = val;
  }

  setData(val: string) {
    this.data = val;
  }

  setCertificate(val: Certificate | undefined) {
    this.tlsCertificate = val;
  }

  toJSON() {
    return {
      url: this.url,
      interactive: this.interactive,
      metadata: this.metadata,
      grpcWeb: this.grpcWeb,
      environment: this.environmentName,
      data: this.data,
      tlsCertificate: this.tlsCertificate,
    };
  }
}
export const Editor = observer<EditorProps>(({ protoInfo, initialRequest, onRequestChange, active }) => {
  const root = useRootModel();

  const viewModel = useLocalObservable(
    () =>
      new EditorViewModel({
        url: initialRequest?.url || getUrl() || '0.0.0.0:3009',
        interactive: initialRequest?.interactive ?? protoInfo?.usesStream?.() ?? false,
        metadata: initialRequest?.metadata || getMetadata() || '',
        grpcWeb: initialRequest?.grpcWeb ?? false,
        environmentName: initialRequest?.environment || '',
      }),
  );

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, undefined);

  useEffect(() => {
    if (protoInfo && !initialRequest) {
      try {
        const { plain } = protoInfo.service.methodsMocks[protoInfo.methodName]();
        viewModel.setData(JSON.stringify(plain, null, 2));
      } catch (e) {
        console.error(e);
        viewModel.setData(
          JSON.stringify(
            { error: 'Error parsing the request message, please report the problem sharing the offending protofile' },
            null,
            2,
          ),
        );
      }
    }

    if (initialRequest) {
      viewModel.setData(initialRequest.inputs || initialRequest.data);
      viewModel.setMetadata(initialRequest.metadata);
      viewModel.setCertificate(initialRequest.tlsCertificate);
    }
  }, []);

  return (
    <div style={styles.tabContainer}>
      <div style={styles.inputContainer}>
        <div style={{ width: '60%' }}>
          <AddressBar
            protoInfo={protoInfo}
            loading={state.loading}
            url={viewModel.url}
            defaultEnvironment={viewModel.environmentName}
            onChangeEnvironment={(environment) => {
              if (!environment) {
                viewModel.setEnvironmentName(undefined);
                onRequestChange &&
                  onRequestChange({
                    ...state,
                    ...viewModel.toJSON(),
                  });
                return;
              }

              viewModel.setUrl(environment.url);
              viewModel.setMetadata(environment.metadata);
              viewModel.setEnvironmentName(environment.name);
              viewModel.setCertificate(environment.tlsCertificate);
              viewModel.setInteractive(environment.interactive);

              onRequestChange &&
                onRequestChange({
                  ...state,
                  ...viewModel.toJSON(),
                  environment: environment.name,
                  url: environment.url,
                  metadata: environment.metadata,
                  tlsCertificate: environment.tlsCertificate,
                  interactive: environment.interactive,
                });
            }}
            onEnvironmentDelete={(environmentName) => {
              root.environments.delete(environmentName);
              viewModel.setEnvironmentName(undefined);
              onRequestChange &&
                onRequestChange({
                  ...state,
                  ...viewModel.toJSON(),
                  environment: '',
                });
            }}
            onEnvironmentSave={(environmentName) => {
              root.environments.updateOrCreate({
                name: environmentName,
                url: viewModel.url,
                interactive: viewModel.interactive,
                metadata: viewModel.metadata,
                tlsCertificate: viewModel.tlsCertificate!,
              });

              viewModel.setEnvironmentName(environmentName);
              onRequestChange &&
                onRequestChange({
                  ...state,
                  ...viewModel.toJSON(),
                  environment: environmentName,
                });
            }}
            onChangeUrl={(e) => {
              viewModel.setUrl(e.target.value);
              storeUrl(e.target.value);
              onRequestChange &&
                onRequestChange({
                  ...state,
                  ...viewModel.toJSON(),
                  url: e.target.value,
                });
            }}
          />
        </div>

        {protoInfo && (
          <Options
            viewModel={viewModel}
            dispatch={dispatch}
            onClickExport={async () => {
              await exportResponseToJSONFile(protoInfo, { ...state, ...viewModel.toJSON() });
            }}
            onInteractiveChange={(checked) => {
              onRequestChange && onRequestChange({ ...state, ...viewModel.toJSON() });
            }}
            tlsSelected={viewModel.tlsCertificate}
            onTLSSelected={(certificate) => {
              viewModel.setCertificate(certificate);
              onRequestChange && onRequestChange({ ...state, ...viewModel.toJSON() });
            }}
          />
        )}
      </div>

      <div style={styles.editorContainer}>
        <Resizable
          enable={{ right: true }}
          defaultSize={{
            width: '50%',
            height: 'auto',
          }}
          maxWidth={'80%'}
          minWidth={'10%'}
        >
          <Request
            data={viewModel.data}
            streamData={state.requestStreamData}
            active={active}
            onChangeData={(value) => {
              viewModel.setData(value);
              onRequestChange && onRequestChange({ ...state, ...viewModel.toJSON() });
            }}
          />

          <div
            style={{
              ...styles.playIconContainer,
              ...(isControlVisible({ ...state, ...viewModel.toJSON() }) ? styles.streamControlsContainer : {}),
            }}
          >
            <Controls
              active={active}
              dispatch={dispatch}
              state={{ ...state, ...viewModel.toJSON() }}
              protoInfo={protoInfo}
            />
          </div>
        </Resizable>

        <div style={{ ...styles.responseContainer }}>
          <Response streamResponse={state.responseStreamData} response={state.response} />
        </div>
      </div>

      <Metadata
        onClickMetadata={() => {
          dispatch(setMetadataVisibilty(!state.metadataOpened));
        }}
        onMetadataChange={(value) => {
          viewModel.setMetadata(value);
          onRequestChange &&
            onRequestChange({
              ...state,
              ...viewModel.toJSON(),
              metadata: value,
            });
        }}
        value={viewModel.metadata}
      />

      {protoInfo && (
        <ProtoFileViewer
          protoInfo={protoInfo}
          visible={state.protoViewVisible}
          onClose={() => dispatch(setProtoVisibility(false))}
        />
      )}
    </div>
  );
});

const styles = {
  tabContainer: {
    width: '100%',
    height: '100%',
    position: 'relative' as 'relative',
  },
  editorContainer: {
    display: 'flex',
    height: '100%',
    borderLeft: '1px solid rgba(0, 21, 41, 0.18)',
    background: '#fff',
  },
  responseContainer: {
    background: 'white',
    maxWidth: 'inherit',
    width: 'inherit',
    display: 'flex',
    flex: '1 1 0%',
    borderLeft: '1px solid #eee',
    borderRight: '1px solid rgba(0, 21, 41, 0.18)',
    overflow: 'auto',
  },
  playIconContainer: {
    position: 'absolute' as 'absolute',
    zIndex: 10,
    right: '-30px',
    marginLeft: '-25px',
    top: 'calc(50% - 80px)',
  },
  streamControlsContainer: {
    right: '-42px',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    border: '1px solid rgba(0, 21, 41, 0.18)',
    borderBottom: '1px solid #eee',
    background: '#fafafa',
    padding: '15px',
    boxShadow: '2px 0px 4px 0px rgba(0,0,0,0.20)',
  },
};
