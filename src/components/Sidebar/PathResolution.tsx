import * as React from 'react';
import { storeImportPaths } from '../../storage';
import { Button, Card, CardList, Text } from '@blueprintjs/core';

interface PathResolutionProps {
  onImportsChange?: (paths: string[]) => void;
  importPaths: string[];
}

export function PathResolution({ importPaths, onImportsChange }: PathResolutionProps) {
  return (
    <CardList>
      {importPaths.sort().map((importPath) => (
        <Card key={importPath} style={{ display: 'flex', flexDirection: 'row' }}>
          <Text style={{ flex: 1 }}>{importPath}</Text>
          <Button
            minimal
            intent="danger"
            icon="delete"
            onClick={() => {
              removePath(importPath, importPaths, onImportsChange);
            }}
          />
        </Card>
      ))}
    </CardList>
  );
}

export function addImportPath(path: string, importPaths: string[], setImportPath?: (path: string[]) => void): boolean {
  if (path !== '' && importPaths.indexOf(path) === -1) {
    const paths = [...importPaths, path];
    setImportPath && setImportPath(paths);
    storeImportPaths(paths);
    return true;
  }

  return false;
}

function removePath(path: string, importPaths: string[], setImportPath?: (path: string[]) => void) {
  const newPaths = importPaths.filter((currentPath) => currentPath !== path);
  setImportPath && setImportPath(newPaths);
  storeImportPaths(newPaths);
}
