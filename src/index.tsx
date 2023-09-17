import { FocusStyleManager } from '@blueprintjs/core';
import * as React from 'react';
import { render } from 'react-dom';

import App from './App';
import './app.global.css';
import { Root } from './model';

FocusStyleManager.onlyShowFocusOnTabs();

const model = new Root();

render(<App model={model} />, document.getElementById('root'));

postMessage({ payload: 'removeLoading' }, '*');
