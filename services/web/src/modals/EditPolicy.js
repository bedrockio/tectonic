import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
// --- Generator: end

export default class EditPolicy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      loading: false,
      policy: props.policy || {},
    };
  }

  componentDidUpdate(lastProps) {
    const { policy } = this.props;
    if (policy && policy !== lastProps.policy) {
      this.setState({
        policy,
      });
    }
  }

  isUpdate() {
    return !!this.props.policy;
  }

  setField = (evt, { name, value }) => {
    this.setState({
      policy: {
        ...this.state.policy,
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
      const { policy } = this.state;
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/access-policies/${policy.id}`,
          body: policy,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/access-policies',
          body: policy, // TODO: update to work with return of {policy, token}
        });
        this.setState({
          policy: {},
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
    const { policy, open, loading, error } = this.state;
    return (
      <Modal
        closeIcon
        open={open}
        trigger={trigger}
        closeOnDimmerClick={false}
        onOpen={() => this.setState({ open: true })}
        onClose={() => this.setState({ open: false })}>
        <Modal.Header>{this.isUpdate() ? `Edit "${policy.name}"` : 'New Policy'}</Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form noValidate id="edit-policy" error={!!error} onSubmit={this.onSubmit}>
              {error && <Message error content={error.message} />}
              {/* --- Generator: fields */}
              <Form.Input
                required
                type="text"
                name="name"
                label="Name"
                value={policy.name || ''}
                onChange={this.setField}
              />
              <Form.TextArea
                name="description"
                label="Description"
                type="text"
                value={policy.description || ''}
                onChange={this.setField}
              />
              {/* --- Generator: end */}
            </Form>
          </AutoFocus>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-policy"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
