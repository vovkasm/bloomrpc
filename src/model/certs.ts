import Store from 'electron-store';
import { makeAutoObservable, toJS } from 'mobx';
import { basename } from 'path';

export interface CertFile {
  fileName: string;
  filePath: string;
}

export interface Certificate {
  rootCert: CertFile;
  privateKey?: CertFile;
  certChain?: CertFile;
  sslTargetHost?: string;
  useServerCertificate?: boolean;
}

export class Certs {
  private _store = new Store<{ certificates: Certificate[] }>({ name: 'tls' });
  private _certs: Certificate[];

  get list(): Certificate[] {
    return this._certs.slice();
  }

  constructor() {
    const serverCertificate = {
      useServerCertificate: true,
      rootCert: { fileName: 'Server Certificate', filePath: '' },
    };
    this._certs = this._store.get('certificates', [serverCertificate]);
    makeAutoObservable(this);
  }

  add(filePath: string): Certificate | undefined {
    if (!filePath || this._certs.findIndex((cert) => cert.rootCert.filePath === filePath) >= 0) return;
    const cert: Certificate = { rootCert: { fileName: basename(filePath), filePath } };
    this._certs.push(cert);
    this._save();
    return cert;
  }

  remove(filePath: string) {
    const idx = this._certs.findIndex((c) => c.rootCert.filePath);
    if (idx < 0) return;
    this._certs.splice(idx, 1);
    this._save();
  }

  clear() {
    this._store.clear();
  }

  private _save() {
    this._store.set('certificates', toJS(this._certs));
  }
}
