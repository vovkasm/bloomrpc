import { Button, HTMLTable, InputGroup, Radio } from '@blueprintjs/core';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { Certificate } from '../../behaviour';
import { useRootModel } from '../../model-provider';

interface TLSManagerProps {
  selected?: Certificate;
  onSelected?: (value?: Certificate) => void;
}

export const TLSManager = observer(({ selected, onSelected }: TLSManagerProps) => {
  const root = useRootModel();
  return (
    <>
      <Button
        intent="primary"
        fill
        large
        onClick={async () => {
          const cert = await root.addCertificate();
          // TODO(vovkasm): fix it
          if (isCertsEqual(cert, selected)) {
            onSelected && onSelected(cert);
          }
        }}
        icon="add"
        text="Add Root Certificate"
      />
      <HTMLTable striped style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>
              <Radio name={'tls'} value={''} checked={!selected} onChange={() => onSelected && onSelected()} />
            </th>
            <th>Root Certificate</th>
            <th>Private Key</th>
            <th>Cert Chain</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {root.certs.list.map((certificate) => {
            return (
              <tr key={certificate.rootCert.filePath}>
                <td>
                  <Radio
                    name={'tls'}
                    value={certificate.rootCert.filePath}
                    checked={selected ? certificate.rootCert.filePath === selected.rootCert.filePath : false}
                    onChange={() => onSelected && onSelected(certificate)}
                  />
                </td>
                <td>
                  <span title={certificate.rootCert.filePath}>{certificate.rootCert.fileName}</span>
                </td>
                {certificate.useServerCertificate ? (
                  <>
                    <td>
                      <div>-</div>
                    </td>
                    <td>
                      <div>-</div>
                    </td>
                    <td></td>
                    <td></td>
                  </>
                ) : (
                  <>
                    <td>
                      {certificate.privateKey ? (
                        <span>{certificate.privateKey?.fileName || '-'}</span>
                      ) : (
                        <a
                          onClick={async (e) => {
                            e.preventDefault();
                            root.importPrivateKey(certificate);
                            if (isCertsEqual(certificate, selected)) {
                              onSelected && onSelected(certificate);
                            }
                          }}
                        >
                          Import Key
                        </a>
                      )}
                    </td>
                    <td>
                      {certificate.certChain ? (
                        <span>{certificate.certChain?.fileName || '-'}</span>
                      ) : (
                        <a
                          onClick={async (e) => {
                            e.preventDefault();
                            root.importCertChain(certificate);
                            if (isCertsEqual(certificate, selected)) {
                              onSelected && onSelected(certificate);
                            }
                          }}
                        >
                          Import Cert Chain
                        </a>
                      )}
                    </td>
                    <td>
                      <InputGroup
                        placeholder={'ssl target host'}
                        defaultValue={certificate.sslTargetHost}
                        onChange={(e) => {
                          runInAction(() => {
                            certificate.sslTargetHost = e.target.value;
                          });
                          if (isCertsEqual(certificate, selected)) {
                            onSelected && onSelected(certificate);
                          }
                        }}
                      />
                    </td>
                    <td>
                      <Button
                        intent="danger"
                        icon="delete"
                        minimal
                        onClick={() => {
                          if (isCertsEqual(certificate, selected)) {
                            onSelected && onSelected();
                          }
                          root.certs.remove(certificate.rootCert.filePath);
                        }}
                      />
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </HTMLTable>
    </>
  );
});

function isCertsEqual(c1: Certificate | undefined, c2: Certificate | undefined): boolean {
  return c1 && c2 ? c1.rootCert.filePath === c2.rootCert.filePath : false;
}
