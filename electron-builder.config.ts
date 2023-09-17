import { Configuration } from 'electron-builder';

const config: Configuration = {
  appId: 'org.vovkasm.desktop.BloomRPC',
  asar: true,

  directories: {
    output: 'release/${version}',
    buildResources: 'resources',
  },
  files: ['dist-electron', 'dist'],
  mac: {
    artifactName: '${productName}_${version}.${ext}',
    target: ['dmg', 'zip'],
  },
  win: {
    artifactName: '${productName}_${version}.${ext}',
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },
};

export default config;
