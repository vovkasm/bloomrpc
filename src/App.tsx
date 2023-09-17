import * as React from 'react';
import { BloomRPC } from './components/BloomRPC';
import { HotkeysProvider } from '@blueprintjs/core';

export default function App() {
  return (
    <HotkeysProvider>
      <BloomRPC />
    </HotkeysProvider>
  );
}
