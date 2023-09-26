import { Button, Dialog, DialogBody, Icon, Menu, MenuItem, Popover, Switch, Tooltip } from '@blueprintjs/core';
import React from 'react';

import type { Certificate } from '../../model';
import { EditorAction } from './Editor';
import type { EditorViewModel } from './Editor';
import { TLSManager } from './TLSManager';
import { setProtoVisibility } from './actions';

interface OptionsProps {
  dispatch: React.Dispatch<EditorAction>;
  onInteractiveChange?: (chcked: boolean) => void;
  tlsSelected?: Certificate;
  onTLSSelected?: (selected?: Certificate) => void;
  onClickExport?: () => void;
  viewModel: EditorViewModel;
}

export function Options({
  dispatch,
  onInteractiveChange,
  tlsSelected,
  onTLSSelected,
  onClickExport,
  viewModel,
}: OptionsProps) {
  const [tlsModalVisible, setTlsModalVisible] = React.useState(false);

  return (
    <div style={{ ...styles.optionContainer, ...styles.inline }}>
      <div style={{ paddingLeft: 15 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Tooltip placement="bottom" content={tlsSelected ? 'Secure Connection' : 'Unsecure Connection'}>
            <Icon icon={tlsSelected ? 'lock' : 'unlock'} size={18} color={tlsSelected ? '#28d440' : '#bdbcbc'} />
          </Tooltip>
          <span onClick={() => setTlsModalVisible(true)} style={styles.tlsButton}>
            <span style={{}}>TLS</span>
          </span>
        </div>

        <Dialog
          title="TLS / SSL Manager"
          icon="key"
          isOpen={tlsModalVisible}
          onClose={() => {
            setTlsModalVisible(false);
          }}
          style={{ minWidth: '80%' }}
        >
          <DialogBody>
            <TLSManager selected={tlsSelected} onSelected={onTLSSelected} />
          </DialogBody>
        </Dialog>
      </div>

      <div style={{ ...styles.inline }}>
        <Popover
          content={
            <Menu>
              <MenuItem
                key="0"
                text="Export response"
                onClick={(e) => {
                  e.preventDefault();
                  onClickExport && onClickExport();
                }}
              />
            </Menu>
          }
          interactionKind="click"
          placement="bottom"
        >
          <div style={{ marginRight: 5, marginTop: 2, cursor: 'pointer', color: '#b5b5b5' }}>
            <Icon icon="caret-down" />
          </div>
        </Popover>
        <div style={{ paddingRight: 10 }}>
          <Switch
            large
            innerLabel="GRPC"
            innerLabelChecked="WEB"
            defaultChecked={viewModel.grpcWeb}
            onChange={(ev) => {
              viewModel.setGrpcWeb((ev.target as HTMLInputElement).checked);
            }}
          />
        </div>
        <div style={{ paddingRight: 10 }}>
          <Switch
            large
            innerLabel="Manual"
            innerLabelChecked="Interactive"
            defaultChecked={viewModel.interactive}
            onChange={(ev) => {
              const el = ev.target as HTMLInputElement;
              viewModel.setInteractive(el.checked);
              onInteractiveChange && onInteractiveChange(el.checked);
            }}
          />
        </div>

        <Button icon="code" outlined text="View Proto" onClick={() => dispatch(setProtoVisibility(true))} />
      </div>
    </div>
  );
}

const styles = {
  optionContainer: {
    width: '50%',
  },
  inline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tlsButton: {
    marginLeft: 10,
    cursor: 'pointer',
    background: '#fafafa',
    padding: '1px 10px',
    borderRadius: '3px',
    fontWeight: 500,
    fontSize: '13px',
    border: '1px solid #d8d8d8',
  },
};
