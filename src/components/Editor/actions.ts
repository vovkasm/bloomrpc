import { GRPCEventEmitter } from '../../behaviour';
import type { Certificate } from '../../model';
import { EditorResponse } from './Editor';

const actions = {
  SET_DATA: 'SET_DATA',
  SET_IS_LOADING: 'SET_IS_LOADING',
  SET_RESPONSE: 'SET_RESPONSE',
  SET_CALL: 'SET_CALL',
  SET_METADATA_VISIBILITY: 'SET_METADATA_VISIBILITY',
  SET_PROTO_VISIBILITY: 'SET_PROTO_VIEW',
  SET_REQUEST_STREAM_DATA: 'SET_REQUEST_STREAM_DATA',
  SET_RESPONSE_STREAM_DATA: 'SET_RESPONSE_STREAM_DATA',
  ADD_RESPONSE_STREAM_DATA: 'ADD_RESPONSE_STREAM_DATA',
  SET_STREAM_COMMITTED: 'SET_STREAM_COMMITTED',
  SET_SSL_CERTIFICATE: 'SET_SSL_CERTIFICATE',
  SET_ENVIRONMENT: 'SET_ENVIRONMENT',
} as const;

export function setData(data: string) {
  return { type: actions.SET_DATA, data };
}

export function setIsLoading(isLoading: boolean) {
  return { type: actions.SET_IS_LOADING, isLoading };
}

export function setResponse(response: EditorResponse) {
  return { type: actions.SET_RESPONSE, response };
}

export function setCall(call?: GRPCEventEmitter) {
  return { type: actions.SET_CALL, call };
}

export function setMetadataVisibilty(visible: boolean) {
  return { type: actions.SET_METADATA_VISIBILITY, visible };
}

export function setProtoVisibility(visible: boolean) {
  return { type: actions.SET_PROTO_VISIBILITY, visible };
}

export function setRequestStreamData(requestData: string[]) {
  return { type: actions.SET_REQUEST_STREAM_DATA, requestData };
}

export function setResponseStreamData(responseData: EditorResponse[]) {
  return { type: actions.SET_RESPONSE_STREAM_DATA, responseData };
}

export function addResponseStreamData(responseData: EditorResponse) {
  return { type: actions.ADD_RESPONSE_STREAM_DATA, responseData };
}

export function setStreamCommitted(committed: boolean) {
  return { type: actions.SET_STREAM_COMMITTED, committed };
}

export function setTSLCertificate(certificate?: Certificate) {
  return { type: actions.SET_SSL_CERTIFICATE, certificate };
}

export function setEnvironment(environment: string) {
  return { type: actions.SET_ENVIRONMENT, environment };
}

export { actions };
