import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
// --- Generator: end

export default class EditApplicationCredential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      loading: false,
      applicationCredential: props.applicationCredential || {},
    };
  }

  componentDidUpdate(lastProps) {
    const { applicationCredential } = this.props;
    if (applicationCredential && applicationCredential !== lastProps.applicationCredential) {
      this.setState({
        applicationCredential,
      });
    }
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
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { applicationCredential } = this.state;
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
        this.setState({
          applicationCredential: {},
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
    const { applicationCredential, open, loading, error } = this.state;
    return (
      <Modal
        closeIcon
        open={open}
        trigger={trigger}
        closeOnDimmerClick={false}
        onOpen={() => this.setState({ open: true })}
        onClose={() => this.setState({ open: false })}>
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
      </Modal>
    );
  }
}
