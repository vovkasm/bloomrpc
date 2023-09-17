import { ipcRenderer } from 'electron';
import { makeAutoObservable } from 'mobx';

import { ImportPaths } from './import-paths';

export class Root {
  readonly importPaths = new ImportPaths();

  constructor() {
    makeAutoObservable(this);
  }

  /** Opens directory selection dialog, then adds selected dir to import paths */
  async addImportPath() {
    const path = await this.importResolvePath();
    if (!path) return;
    this.importPaths.add(path);
  }

  private async importResolvePath(): Promise<string | undefined> {
    const filePaths = (await ipcRenderer.invoke('open-directory')) as string[];
    return filePaths[0] || undefined;
  }
}
