import { FocusStyleManager } from '@blueprintjs/core';
import * as React from 'react';
import { render } from 'react-dom';

import App from './App';
import './app.global.css';

FocusStyleManager.onlyShowFocusOnTabs();

render(<App />, document.getElementById('root'));

postMessage({ payload: 'removeLoading' }, '*');
