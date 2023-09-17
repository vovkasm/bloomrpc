import { ipcRenderer } from 'electron';
import * as path from 'path';

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

export async function importRootCert(): Promise<Certificate | undefined> {
  const filePath = await ipcRenderer.invoke('open-single-file');
  if (!filePath) return undefined;

  return {
    rootCert: {
      fileName: path.basename(filePath),
      filePath: filePath,
    },
  };
}

export async function importPrivateKey(): Promise<CertFile | undefined> {
  const filePath = await ipcRenderer.invoke('open-single-file');
  if (!filePath) return undefined;

  return {
    fileName: path.basename(filePath),
    filePath: filePath,
  };
}

export async function importCertChain(): Promise<CertFile | undefined> {
  const filePath = await ipcRenderer.invoke('open-single-file');
  if (!filePath) return undefined;

  return {
    fileName: path.basename(filePath),
    filePath: filePath,
  };
}
