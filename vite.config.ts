import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json';

const external = Object.keys('dependencies' in pkg ? pkg.dependencies : {});

const cspPlugin: Plugin = {
  name: 'cspPlugin',
  apply: 'serve',
  configureServer: {
    handler(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.match(/app\.html$/)) {
          res.appendHeader('Content-Security-Policy', `script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src blob:`)
        }
        next();
      });
    }
  }
};

export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || process.env.VSCODE_DEBUG ? true : false;

  const cfg: UserConfig = {
    build: {
      rollupOptions: {
        input: {
          app: path.join(__dirname, 'src/app.html'),
        },
      },
    },
    resolve: {
      alias: [
        {find: 'rc-switch', replacement: 'rc-switch/lib/index.js'}
      ]
    },
    define: {
      __PRODUCT_NAME__: JSON.stringify(pkg.productName),
      __COPYRIGHT__: JSON.stringify(pkg.license),
      __HOMEPAGE__: JSON.stringify(pkg.homepage),
      __DESCRIPTION__: JSON.stringify(pkg.description),
      __LICENSE__: JSON.stringify(pkg.license),
      __BUG_REPORT_URL__: JSON.stringify(pkg.bugs.url),
      __VERSION__: JSON.stringify(pkg.version)
    },
    plugins: [
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              options.startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: { external },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: { external },
            },
          },
        },
        renderer: {
          resolve: {
            ismobilejs: { type: 'cjs' },
          }
        }
      }),
      react({
        jsxRuntime: 'classic',
      }),
      cspPlugin,
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return { host: url.hostname, port: +url.port }
    })(),
    clearScreen: false,
  }
  return cfg;
})
