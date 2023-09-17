import Store from 'electron-store';
import { makeAutoObservable } from 'mobx';

export class ImportPaths {
  private _store = new Store<{ paths: string[] }>({ name: 'importPaths' });
  private _paths: string[];

  get paths(): string[] {
    return this._paths.slice().sort();
  }

  constructor() {
    this._paths = this._store.get('paths', []);
    makeAutoObservable(this);
  }

  add(path: string) {
    if (!path || this._paths.indexOf(path) >= 0) return;
    this._paths.push(path);
    this._save();
  }

  remove(path: string) {
    const idx = this._paths.indexOf(path);
    if (idx < 0) return;
    this._paths.splice(idx, 1);
    this._save();
  }

  clear() {
    this._store.clear();
  }

  private _save() {
    this._store.set('paths', this._paths.slice());
  }
}
