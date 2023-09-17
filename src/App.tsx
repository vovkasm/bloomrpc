import { HotkeysProvider } from '@blueprintjs/core';
import * as React from 'react';

import { BloomRPC } from './components/BloomRPC';
import type { Root } from './model';
import { ModelContext } from './model-provider';

export default function App(props: { model: Root }) {
  return (
    <ModelContext.Provider value={props.model}>
      <HotkeysProvider>
        <BloomRPC />
      </HotkeysProvider>
    </ModelContext.Provider>
  );
}
