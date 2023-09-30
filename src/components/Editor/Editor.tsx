import { makeAutoObservable, observable } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import * as React from 'react';
import { useEffect } from 'react';

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

  protoViewVisible: boolean = false;
  loading: boolean = false;
  response: EditorResponse = { output: '' };
  requestStreamData: string[] = [];
  responseStreamData: EditorResponse[] = [];
  call?: GRPCEventEmitter;
  streamCommitted: boolean = false;

  constructor(init: EditorViewModelInit) {
    this.url = init.url;
    this.interactive = init.interactive;
    this.metadata = init.metadata;
    this.grpcWeb = init.grpcWeb;
    this.environmentName = init.environmentName;
    makeAutoObservable(this, {
      tlsCertificate: observable.ref,
      requestStreamData: observable.ref,
      call: observable.ref,
    });
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

  setProtoViewVisible(val: boolean) {
    this.protoViewVisible = val;
  }

  setLoading(val: boolean) {
    this.loading = val;
  }

  setResponse(val: EditorResponse) {
    this.response = val;
  }

  setRequestStreamData(data: string[]) {
    this.requestStreamData = data;
  }

  clearResponseStreamData() {
    this.responseStreamData = [];
  }

  addResponseStreamData(val: EditorResponse) {
    this.responseStreamData.push(val);
  }

  setCall(call: GRPCEventEmitter | undefined) {
    this.call = call;
  }

  setStreamCommited(val: boolean) {
    this.streamCommitted = val;
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
      loading: this.loading,
      response: this.response,
      protoViewVisible: this.protoViewVisible,
      requestStreamData: this.requestStreamData,
      responseStreamData: this.responseStreamData,
      call: this.call,
      streamCommitted: this.streamCommitted,
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
            loading={viewModel.loading}
            url={viewModel.url}
            defaultEnvironment={viewModel.environmentName}
            onChangeEnvironment={(environment) => {
              if (!environment) {
                viewModel.setEnvironmentName(undefined);
                onRequestChange && onRequestChange(viewModel.toJSON());
                return;
              }

              viewModel.setUrl(environment.url);
              viewModel.setMetadata(environment.metadata);
              viewModel.setEnvironmentName(environment.name);
              viewModel.setCertificate(environment.tlsCertificate);
              viewModel.setInteractive(environment.interactive);

              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
            onEnvironmentDelete={(environmentName) => {
              root.environments.delete(environmentName);
              viewModel.setEnvironmentName(undefined);
              onRequestChange && onRequestChange(viewModel.toJSON());
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
              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
            onChangeUrl={(e) => {
              viewModel.setUrl(e.target.value);
              storeUrl(e.target.value);
              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
          />
        </div>

        {protoInfo ? (
          <Options
            viewModel={viewModel}
            onClickExport={async () => {
              await exportResponseToJSONFile(protoInfo, viewModel.toJSON());
            }}
            onInteractiveChange={(checked) => {
              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
            onTLSSelected={(certificate) => {
              viewModel.setCertificate(certificate);
              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
          />
        ) : null}
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
            streamData={viewModel.requestStreamData}
            active={active}
            onChangeData={(value) => {
              viewModel.setData(value);
              onRequestChange && onRequestChange(viewModel.toJSON());
            }}
          />

          <div
            style={{
              ...styles.playIconContainer,
              ...(isControlVisible(viewModel.toJSON()) ? styles.streamControlsContainer : {}),
            }}
          >
            <Controls viewModel={viewModel} active={active} state={viewModel.toJSON()} protoInfo={protoInfo} />
          </div>
        </Resizable>

        <div style={{ ...styles.responseContainer }}>
          <Response viewModel={viewModel} />
        </div>
      </div>

      <Metadata
        onMetadataChange={(value) => {
          viewModel.setMetadata(value);
          onRequestChange && onRequestChange(viewModel.toJSON());
        }}
        value={viewModel.metadata}
      />

      {protoInfo && <ProtoFileViewer viewModel={viewModel} protoInfo={protoInfo} />}
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
