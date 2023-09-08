import * as React from 'react';
import { render } from 'react-dom';
import './app.global.css';
import App from './App';

render(<App/>, document.getElementById('root'));

postMessage({ payload: 'removeLoading' }, '*')

