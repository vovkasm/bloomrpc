import { ipcRenderer } from 'electron';
import { makeAutoObservable } from 'mobx';
import { basename } from 'path';

import { Certificate, Certs } from './certs';
import { Editor } from './editor';
import { Environments } from './environments';
import { ImportPaths } from './import-paths';

export class Root {
  readonly certs = new Certs();
  readonly importPaths = new ImportPaths();
  readonly environments = new Environments();
  readonly editor = new Editor();

  constructor() {
    makeAutoObservable(this);
  }

  /** Opens directory selection dialog, then adds selected dir to import paths */
  async addImportPath() {
    const path = await this.openDirectory();
    if (!path) return;
    this.importPaths.add(path);
  }

  /** Opens file selector and adds selected file to certs list */
  async addCertificate(): Promise<Certificate | undefined> {
    const path = await this.openFile();
    if (!path) return undefined;
    return this.certs.add(path);
  }

  async importPrivateKey(cert: Certificate): Promise<void> {
    const path = await this.openFile();
    if (!path) return;

    cert.privateKey = { fileName: basename(path), filePath: path };
  }

  async importCertChain(cert: Certificate): Promise<void> {
    const path = await this.openFile();
    if (!path) return;

    cert.certChain = { fileName: basename(path), filePath: path };
  }

  private async openDirectory(): Promise<string | undefined> {
    const filePaths = (await ipcRenderer.invoke('open-directory')) as string[];
    return filePaths[0] || undefined;
  }

  private async openFile(): Promise<string | undefined> {
    return await ipcRenderer.invoke('open-single-file');
  }

  clear() {
    this.certs.clear();
    this.editor.clear();
    this.environments.clear();
    this.importPaths.clear();
  }
}
