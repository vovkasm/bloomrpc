import { HotkeysProvider } from '@blueprintjs/core';
import * as React from 'react';

import { BloomRPC } from './components/BloomRPC';

export default function App() {
  return (
    <HotkeysProvider>
      <BloomRPC />
    </HotkeysProvider>
  );
}
