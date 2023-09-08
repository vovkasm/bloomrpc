import { BrowserWindow, shell } from 'electron';

import path from 'path';

const icon = path.join(process.resourcesPath, 'icon.ico')

let aboutWin: BrowserWindow;

export default function openAboutWindow(parentWindow?: BrowserWindow) {
    if (aboutWin !== null) {
        aboutWin.focus();
        return aboutWin;
    }

    aboutWin = new BrowserWindow({
        width: 400,
        height: 400,
        useContentSize: true,
        titleBarStyle: 'hiddenInset',
        icon: icon,
        parent: parentWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    aboutWin.once('closed', () => {
        aboutWin = undefined as any;
    });

    const aboutHTML = process.env.NODE_ENV !== 'production'
        ? `file://${__dirname}/about.html`
        : `file://${__dirname}/about/about.html`
    aboutWin.loadURL(aboutHTML);

    aboutWin.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    aboutWin.webContents.once('dom-ready', () => {
        let info;
        if (process.env.NODE_ENV !== 'production') {
            const pkgDep = require('../../package.json')
            info = {
                icon_path: icon,
                product_name: pkgDep.productName,
                copyright: pkgDep.license,
                homepage: pkgDep.homepage,
                description: pkgDep.description,
                license: pkgDep.license,
                bug_report_url: pkgDep.bugs.url,
                version: pkgDep.version,
                use_version_info: true
            }
        } else {
            info = {
                icon_path: icon,
                product_name: __PRODUCT_NAME__,
                copyright: __COPYRIGHT__,
                homepage: __HOMEPAGE__,
                description: __DESCRIPTION__,
                license: __LICENSE__,
                bug_report_url: __BUG_REPORT_URL__,
                version: __VERSION__,
                use_version_info: true,
            }
        }
        aboutWin.webContents.send('about-window:info', info);
    });

    aboutWin.once('ready-to-show', () => {
        aboutWin.show();
    });

    aboutWin.setMenu(null);
    aboutWin.setMenuBarVisibility(false)

    return aboutWin;
}

