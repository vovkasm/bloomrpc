import Store from 'electron-store';
import { makeAutoObservable, toJS } from 'mobx';

import { strcmp } from '../utils';
import type { Certificate } from './certs';

export interface EditorEnvironment {
  name: string;
  url: string;
  metadata: string;
  interactive: boolean;
  tlsCertificate: Certificate;
}

export class Environments {
  private _store = new Store<{ ENVIRONMENTS: EditorEnvironment[] }>({ name: 'environments' });
  private _environments: EditorEnvironment[];

  get list(): EditorEnvironment[] {
    return this._environments.slice().sort((a, b) => strcmp(a.name, b.name));
  }

  constructor() {
    this._environments = this._store.get('ENVIRONMENTS', []);
    makeAutoObservable(this);
  }

  updateOrCreate(data: EditorEnvironment) {
    let environment: EditorEnvironment | undefined = this._environments.find((env) => env.name === data.name);
    if (environment) {
      environment.interactive = data.interactive;
      environment.metadata = data.metadata;
      environment.url = data.url;
      // TODO(vovkasm): this should be something different
      environment.tlsCertificate = { ...environment.tlsCertificate, ...data.tlsCertificate };
    } else {
      environment = {
        name: data.name,
        interactive: data.interactive,
        metadata: data.metadata,
        url: data.url,
        tlsCertificate: data.tlsCertificate,
      };
      this._environments.push(environment);
    }
    this._save();
  }

  delete(name: string) {
    const idx = this._environments.findIndex((env) => env.name === name);
    if (idx >= 0) this._environments.splice(idx, 1);
    this._save();
  }

  clear() {
    this._store.clear();
  }

  private _save() {
    this._store.set('ENVIRONMENTS', toJS(this._environments));
  }
}
