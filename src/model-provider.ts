import { createContext, useContext } from 'react';

import type { Root } from './model/root';

export const ModelContext = createContext<Root | undefined>(undefined);

export function useRootModel(): Root {
  const root = useContext(ModelContext);
  if (!root) throw new Error('No root model in context');
  return root;
}
