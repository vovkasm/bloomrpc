/// <reference types="vite-plugin-electron/electron-env" />

declare const __PRODUCT_NAME__: string;
declare const __COPYRIGHT__: string;
declare const __HOMEPAGE__: string;
declare const __DESCRIPTION__: string;
declare const __LICENSE__: string;
declare const __BUG_REPORT_URL__: string;
declare const __VERSION__: string;

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true';
    DIST_ELECTRON: string;
    DIST: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}
