import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
// --- Generator: end

export default class EditAccessCredential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      loading: false,
      accessCredential: props.accessCredential || {},
    };
  }

  componentDidUpdate(lastProps) {
    const { accessCredential } = this.props;
    if (accessCredential && accessCredential !== lastProps.accessCredential) {
      this.setState({
        accessCredential,
      });
    }
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
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { accessCredential } = this.state;
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/access-credentials/${accessCredential.id}`,
          body: accessCredential,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/access-credentials',
          body: accessCredential,
        });
        this.setState({
          accessCredential: {},
        });
      }
      this.setState({
        open: false,
        loading: false,
      });
      this.props.onSave();
    } catch (error) {
      this.setState({
        error,
        loading: false,
      });
    }
  };

  render() {
    const { trigger } = this.props;
    const { accessCredential, open, loading, error } = this.state;
    return (
      <Modal
        closeIcon
        open={open}
        trigger={trigger}
        closeOnDimmerClick={false}
        onOpen={() => this.setState({ open: true })}
        onClose={() => this.setState({ open: false })}>
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
              <Form.TextArea
                name="description"
                label="Description"
                type="text"
                value={accessCredential.description || ''}
                onChange={this.setField}
              />
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
      </Modal>
    );
  }
}
