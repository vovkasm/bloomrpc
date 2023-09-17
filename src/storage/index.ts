import { clearEditor } from './editor';
import { clearTLS } from './tls';

export * from './editor';
export * from './tls';

export function clearAll() {
  clearEditor();
  clearTLS();
}
