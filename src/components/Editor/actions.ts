import { GRPCEventEmitter } from '../../behaviour';
import type { EditorResponse } from './Editor';

const actions = {
  SET_CALL: 'SET_CALL',
  SET_PROTO_VISIBILITY: 'SET_PROTO_VIEW',
  SET_REQUEST_STREAM_DATA: 'SET_REQUEST_STREAM_DATA',
  SET_RESPONSE_STREAM_DATA: 'SET_RESPONSE_STREAM_DATA',
  ADD_RESPONSE_STREAM_DATA: 'ADD_RESPONSE_STREAM_DATA',
  SET_STREAM_COMMITTED: 'SET_STREAM_COMMITTED',
} as const;

export function setCall(call?: GRPCEventEmitter) {
  return { type: actions.SET_CALL, call };
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

export { actions };
