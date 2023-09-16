import * as React from 'react';
import { Button, HTMLTable, InputGroup, Radio } from '@blueprintjs/core';

import { Certificate, importCertChain, importPrivateKey, importRootCert } from "../../behaviour";
import { getTLSList, storeTLSList } from "../../storage";

interface TLSManagerProps {
    selected?: Certificate
    onSelected?: (value?: Certificate) => void
}

export function TLSManager({ selected, onSelected }: TLSManagerProps) {
    const [certs, setStateCerts] = React.useState<Certificate[]>([]);

    function setCerts(newCerts: Certificate[]) {
      setStateCerts(newCerts);
      storeTLSList(newCerts);
    }

    React.useEffect(() => {
      setStateCerts(getTLSList());
    }, []);

    return (
        <>
          <Button
              intent="primary"
              fill
              large
              onClick={async () => {
                const cert = await handleImportRootCert(certs, setCerts);

                if (cert && cert.rootCert.filePath === (selected && selected.rootCert.filePath)) {
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
                  <Radio name={"tls"} value={""} checked={!selected} onChange={() => onSelected && onSelected()} />
                </th>
                <th>Root Certificate</th>
                <th>Private Key</th>
                <th>Cert Chain</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {
                certs.map((certificate) => {
                  return <tr key={certificate.rootCert.filePath}>
                    <td>
                      <Radio
                        name={"tls"}
                        value={certificate.rootCert.filePath}
                        checked={selected ? certificate.rootCert.filePath === selected.rootCert.filePath : false}
                        onChange={() => onSelected && onSelected(certificate)}
                      />
                    </td>
                    <td>
                      <span title={certificate.rootCert.filePath}>{certificate.rootCert.fileName}</span>
                    </td>
                    {certificate.useServerCertificate ?
                      <>
                        <td><div>-</div></td>
                        <td><div>-</div></td>
                        <td></td>
                        <td></td>
                      </> :
                      <>
                        <td>
                          {
                            certificate.privateKey ?
                              <span>{certificate.privateKey?.fileName||'-'}</span> :
                              <a onClick={async (e) => {
                                e.preventDefault();
                                const cert = await handleImportPrivateKey(certificate, certs, setCerts);
                                if (cert && cert.rootCert.filePath === (selected && selected.rootCert.filePath)) {
                                  onSelected && onSelected(cert);
                                }
                              }}>Import Key</a>
                          }
                        </td>
                        <td>
                          {
                            certificate.privateKey ?
                              <span>{certificate.privateKey?.fileName||'-'}</span> :
                              <a onClick={async (e) => {
                                e.preventDefault();
                                const cert = await handleImportCertChain(certificate, certs, setCerts);
                                if (cert && cert.rootCert.filePath === (selected && selected.rootCert.filePath)) {
                                  onSelected && onSelected(cert);
                                }
                              }}>Import Cert Chain</a>
                          }
                        </td>
                        <td>
                          <InputGroup placeholder={"ssl target host"} defaultValue={certificate.sslTargetHost} onChange={(e) => {
                              const cert = setSslTargetHost(
                                  e.target.value,
                                  certificate,
                                  certs,
                                  setCerts
                              );

                              if (cert && cert.rootCert.filePath === (selected && selected.rootCert.filePath)) {
                                onSelected && onSelected(cert);
                              }
                            }}
                          />
                        </td>
                        <td>
                          <Button intent='danger' icon='delete' minimal onClick={() => {
                              if (selected && selected.rootCert.filePath === certificate.rootCert.filePath) {
                                onSelected && onSelected();
                              }
                              deleteCertificateEntry(certificate, certs, setCerts);
                            }}
                          />
                        </td>
                      </>
                    }
                  </tr>
                })
              }
            </tbody>
          </HTMLTable>
        </>
    );
}

async function handleImportRootCert(certs: Certificate[], setCerts: React.Dispatch<Certificate[]>): Promise<Certificate | void> {
  try {
    const certificate = await importRootCert();
    if (!certificate) return;

    const newCerts = certs
        .filter((cert) => cert.rootCert.filePath !== certificate.rootCert.filePath);

    newCerts.push(certificate);

    setCerts(newCerts);

    return certificate;
  } catch (e) {
    // No file selected.
  }
}

async function handleImportPrivateKey(
    certificate: Certificate,
    certs: Certificate[],
    setCerts: React.Dispatch<Certificate[]>
): Promise<Certificate | void> {
  try {
    const privateKey = await importPrivateKey();
    if (!privateKey) return;

    certificate.privateKey = privateKey;

    const certIndex = certs.findIndex((cert) => cert.rootCert.filePath === certificate.rootCert.filePath);
    certs[certIndex] = certificate;

    setCerts(certs);
    return certificate;
  } catch (e) {
    // No file Selected
  }
}

async function handleImportCertChain(
    certificate: Certificate,
    certs: Certificate[],
    setCerts: React.Dispatch<Certificate[]>
): Promise<Certificate | void> {
  try {
    const certChain = await importCertChain();
    if (!certChain) return;

    certificate.certChain = certChain;

    const certIndex = certs.findIndex((cert) => cert.rootCert.filePath === certificate.rootCert.filePath);
    certs[certIndex] = certificate;

    setCerts(certs);
    return certificate;
  } catch (e) {
    // No file Selected
  }
}

function deleteCertificateEntry(
  certificate: Certificate,
  certs: Certificate[],
  setCerts: React.Dispatch<Certificate[]>
) {
  const certIndex = certs.findIndex((cert) => cert.rootCert.filePath === certificate.rootCert.filePath);

  const certificates = [...certs];
  certificates.splice(certIndex, 1);

  setCerts(certificates);
}

function setSslTargetHost(
    value: string,
    certificate: Certificate,
    certs: Certificate[],
    setCerts: React.Dispatch<Certificate[]>
): Certificate {
  const certIndex = certs.findIndex((cert) => cert.rootCert.filePath === certificate.rootCert.filePath);
  certificate.sslTargetHost = value;
  certs[certIndex] = certificate;

  setCerts(certs);

  return certificate;
}
