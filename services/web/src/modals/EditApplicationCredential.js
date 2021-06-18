import React from 'react';
import { Form, Modal, Message, Button } from 'semantic';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';
import { modal } from 'helpers';

@modal
export default class EditApplicationCredential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      applicationCredential: props.applicationCredential || {},
    };
  }

  isUpdate() {
    return !!this.props.applicationCredential;
  }

  setField = (evt, { name, value }) => {
    this.setState({
      applicationCredential: {
        ...this.state.applicationCredential,
        [name]: value,
      },
    });
  };

  setCheckedField = (evt, { name, checked }) => {
    this.setField(evt, { name, value: checked });
  };

  setNumberField = (evt, { name, value }) => {
    this.setField(evt, { name, value: Number(value) });
  };

  onSubmit = async () => {
    this.setState({
      error: null,
      loading: true,
    });
    const { applicationCredential } = this.state;
    try {
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/application-credentials/${applicationCredential.id}`,
          body: applicationCredential,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/application-credentials',
          body: applicationCredential,
        });
      }
      this.props.onSave();
      this.props.close();
    } catch (error) {
      this.setState({
        error,
        loading: false,
      });
    }
  };

  render() {
    const { applicationCredential, loading, error } = this.state;
    return (
      <>
        <Modal.Header>
          {this.isUpdate() ? `Edit "${applicationCredential.name}"` : 'New ApplicationCredential'}
        </Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form noValidate id="edit-application-credential" error={!!error} onSubmit={this.onSubmit}>
              {error && <Message error content={error.message} />}
              {/* --- Generator: fields */}
              <Form.Input
                required
                type="text"
                name="name"
                label="Name"
                value={applicationCredential.name || ''}
                onChange={this.setField}
              />
              {/* --- Generator: end */}
            </Form>
          </AutoFocus>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-application-credential"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </>
    );
  }
}
