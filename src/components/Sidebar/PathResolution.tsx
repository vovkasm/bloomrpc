import { Button, Card, CardList, Text } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { useRootModel } from '../../model-provider';

export const PathResolution = observer(() => {
  const root = useRootModel();
  return (
    <CardList>
      {root.importPaths.paths.map((importPath) => (
        <Card key={importPath} style={{ display: 'flex', flexDirection: 'row' }}>
          <Text style={{ flex: 1 }}>{importPath}</Text>
          <Button
            minimal
            intent="danger"
            icon="delete"
            onClick={() => {
              root.importPaths.remove(importPath);
            }}
          />
        </Card>
      ))}
    </CardList>
  );
});
