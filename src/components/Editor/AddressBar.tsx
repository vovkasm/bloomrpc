import React, { ChangeEvent } from 'react';
import {
  Alert,
  AnchorButton,
  ControlGroup,
  DialogBody,
  Icon,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Spinner,
} from '@blueprintjs/core';

import { RequestType } from './RequestType';
import { ProtoInfo } from '../../behaviour';
import { EditorEnvironment } from './Editor';

export interface AddressBarProps {
  loading: boolean;
  url: string;
  environments?: EditorEnvironment[];
  protoInfo?: ProtoInfo;
  onChangeUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultEnvironment?: string;
  onChangeEnvironment?: (environment?: EditorEnvironment) => void;
  onEnvironmentSave?: (name: string) => void;
  onEnvironmentDelete?: (name: string) => void;
}

export function AddressBar({
  loading,
  url,
  onChangeUrl,
  protoInfo,
  defaultEnvironment,
  environments,
  onEnvironmentSave,
  onChangeEnvironment,
  onEnvironmentDelete,
}: AddressBarProps) {
  const [currentEnvironmentName, setCurrentEnvironmentName] = React.useState<string>(defaultEnvironment || '');
  const [newEnvironmentName, setNewEnvironmentName] = React.useState<string>('');

  const [confirmedSave, setConfirmedSave] = React.useState(false);
  const [confirmedDelete, setConfirmedDelete] = React.useState(false);

  React.useEffect(() => {
    if (confirmedSave) {
      if (newEnvironmentName) {
        setCurrentEnvironmentName(newEnvironmentName);
        onEnvironmentSave && onEnvironmentSave(newEnvironmentName);
      } else {
        setCurrentEnvironmentName(currentEnvironmentName);
        onEnvironmentSave && onEnvironmentSave(currentEnvironmentName);
      }

      setConfirmedSave(false);
      setNewEnvironmentName('');
    }
  }, [confirmedSave]);

  React.useEffect(() => {
    if (confirmedDelete) {
      onEnvironmentDelete && onEnvironmentDelete(currentEnvironmentName);

      setConfirmedDelete(false);
      setCurrentEnvironmentName('');
    }
  }, [confirmedDelete]);

  const [updateEnvironmentDialogVisible, setUpdateEnvironmentDialogVisible] = React.useState(false);
  const [deleteEnvironmentDialogVisible, setDeleteEnvironmentDialogVisible] = React.useState(false);
  const [addEnvironmentDialogVisible, setAddEnvironmentDialogVisible] = React.useState(false);

  return (
    <ControlGroup>
      <Alert
        icon="document"
        isOpen={updateEnvironmentDialogVisible}
        intent="primary"
        cancelButtonText="Cancel"
        onClose={(confirmed) => {
          if (confirmed) {
            setConfirmedSave(true);
          }
          setUpdateEnvironmentDialogVisible(false);
        }}
      >
        <DialogBody>Do you want to update {currentEnvironmentName}?</DialogBody>
      </Alert>
      <Alert
        icon="delete"
        isOpen={deleteEnvironmentDialogVisible}
        intent="danger"
        cancelButtonText="Cancel"
        onClose={(confirmed) => {
          if (confirmed) {
            setConfirmedDelete(true);
          }
          setDeleteEnvironmentDialogVisible(false);
        }}
      >
        <DialogBody>Are you sure do you want to delete {currentEnvironmentName}?</DialogBody>
      </Alert>
      <Alert
        icon="document"
        isOpen={addEnvironmentDialogVisible}
        intent="primary"
        cancelButtonText="Cancel"
        onClose={(confirmed) => {
          if (confirmed) {
            setConfirmedSave(true);
          }
          setAddEnvironmentDialogVisible(false);
        }}
      >
        <DialogBody>
          <InputGroup
            autoFocus={true}
            required
            placeholder={'Environment name'}
            onChange={(e) => {
              setNewEnvironmentName(e.target.value);
            }}
          />
        </DialogBody>
      </Alert>
      <Popover
        content={
          <Menu>
            <MenuItem
              text="None"
              onClick={() => {
                setCurrentEnvironmentName('');
                onChangeEnvironment && onChangeEnvironment(undefined);
              }}
            />
            {environments
              ? environments.map((environment) => (
                  <MenuItem
                    key={environment.name}
                    text={environment.name}
                    onClick={() => {
                      setCurrentEnvironmentName(environment.name);
                      onChangeEnvironment && onChangeEnvironment(environment);
                    }}
                  />
                ))
              : null}
            <MenuDivider />
            {currentEnvironmentName ? (
              <MenuItem
                text="Update Environment"
                icon="edit"
                onClick={() => {
                  setUpdateEnvironmentDialogVisible(true);
                }}
              />
            ) : null}
            {currentEnvironmentName ? (
              <MenuItem
                text="Delete Environment"
                icon="delete"
                onClick={() => {
                  setDeleteEnvironmentDialogVisible(true);
                }}
              />
            ) : null}
            <MenuItem
              text="Save New Environment"
              icon="add"
              onClick={() => {
                setAddEnvironmentDialogVisible(true);
              }}
            />
          </Menu>
        }
        placement="bottom"
        targetProps={{ style: { width: '20%' } }}
      >
        <AnchorButton
          fill
          alignText="left"
          text={currentEnvironmentName || 'None'}
          rightIcon="caret-down"
          style={{ overflow: 'hidden' }}
        />
      </Popover>

      <InputGroup
        fill
        className="server-url"
        rightElement={
          <div style={{ display: 'flex', alignItems: 'center', width: '125px' }}>
            {loading ? <Spinner size={20} /> : <Icon icon="database" />}
            <RequestType protoInfo={protoInfo} />
          </div>
        }
        value={url}
        onChange={onChangeUrl}
      />
    </ControlGroup>
  );
}
