import { ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import type { EditorViewModel } from '../components/Editor';
import type { ProtoInfo } from './protoInfo';

export async function exportResponseToJSONFile(protoInfo: ProtoInfo, viewModel: EditorViewModel): Promise<void> {
  const filePaths = (await ipcRenderer.invoke('open-directory')) as string[];
  if (!filePaths || filePaths.length === 0) return;

  const timestamp = new Date().getTime();
  const basePath = filePaths[0];
  const fileName = `${protoInfo.service.serviceName}.${protoInfo.methodName}_${timestamp}`;

  const exportPath = path.join(basePath, fileName);

  const responseData = viewModel.response.output
    ? viewModel.response.output
    : JSON.stringify(
        viewModel.responseStreamData.map((steam) => JSON.parse(steam.output)),
        null,
        2,
      );

  fs.writeFileSync(exportPath, responseData);
}
