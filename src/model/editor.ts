import Store from 'electron-store';
import { makeAutoObservable } from 'mobx';

import type { EditorRequest } from '../components/Editor';

type EditorStorage = {
  url: string;
  protos: string[];
  tabs: EditorTabsStorage;
  requests: TabRequestInfo[];
  metadata: string;
};

export interface EditorTabsStorage {
  activeKey: string;
  tabs: {
    protoPath: string;
    methodName: string;
    serviceName: string;
    tabKey: string;
  }[];
}

interface TabRequestInfo extends EditorRequest {
  id: string;
}

export class Editor {
  private _store = new Store<EditorStorage>({ name: 'editor' });
  private _url: string = this._store.get('url', '');
  private _metadata: string = this._store.get('metadata', '');

  get url(): string {
    return this._url;
  }

  get metadata(): string {
    return this._metadata;
  }

  constructor() {
    makeAutoObservable(this);
  }

  setUrl(val: string) {
    this._url = val;
    this._store.set('url', this._url);
  }

  setMetadata(val: string) {
    this._metadata = val;
    this._store.set('metadata', this._metadata);
  }

  clear() {
    this._store.clear();
  }
}
