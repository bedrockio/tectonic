import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';
import SearchDropdown from 'components/SearchDropdown';
import { modal } from 'helpers';

// --- Generator: imports
// --- Generator: end

@modal
export default class EditAccessCredential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      accessCredential: props.accessCredential || {},
    };
  }

  isUpdate() {
    return !!this.props.accessCredential;
  }

  setField = (evt, { name, value }) => {
    this.setState({
      accessCredential: {
        ...this.state.accessCredential,
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
    const { accessCredential } = this.state;
    const body = {
      ...accessCredential,
      accessPolicy: accessCredential.accessPolicy?.id || accessCredential.accessPolicy,
    };
    try {
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/access-credentials/${accessCredential.id}`,
          body,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/access-credentials',
          body,
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
    const { accessCredential, loading, error } = this.state;
    return (
      <>
        <Modal.Header>{this.isUpdate() ? `Edit "${accessCredential.name}"` : 'New AccessCredential'}</Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form noValidate id="edit-access-credential" error={!!error} onSubmit={this.onSubmit}>
              {error && <Message error content={error.message} />}
              {/* --- Generator: fields */}
              <Form.Input
                required
                type="text"
                name="name"
                label="Name"
                value={accessCredential.name || ''}
                onChange={this.setField}
              />
              <Form.Field>
                <label>Policy</label>
                <SearchDropdown
                  value={accessCredential.accessPolicy}
                  name="accessPolicy"
                  onChange={this.setField}
                  onDataNeeded={() =>
                    request({
                      method: 'POST',
                      path: `/1/access-policies/search`,
                    }).then(({ data }) => data)
                  }
                />
              </Form.Field>

              {/* --- Generator: end */}
            </Form>
          </AutoFocus>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-access-credential"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </>
    );
  }
}
