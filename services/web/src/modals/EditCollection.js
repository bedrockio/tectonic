import React from 'react';
import { Modal, Form, Button, Message } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
// --- Generator: end

export default class EditCollection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      loading: false,
      collection: props.collection || {},
    };
  }

  componentDidUpdate(lastProps) {
    const { collection } = this.props;
    if (collection && collection !== lastProps.collection) {
      this.setState({
        collection,
      });
    }
  }

  isUpdate() {
    return !!this.props.collection;
  }

  setField = (evt, { name, value }) => {
    this.setState({
      collection: {
        ...this.state.collection,
        [name]: value,
      },
    });
  };

  setCheckedField = (evt, { name, checked }) => {
    this.setField(evt, { name, value: checked });
  };

  onSubmit = async () => {
    try {
      this.setState({
        loading: true,
      });
      const { collection } = this.state;
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/collections/${collection.id}`,
          body: collection,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/collections',
          body: collection,
        });
        this.setState({
          collection: {},
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
    const { collection, open, loading, error } = this.state;
    return (
      <Modal
        closeIcon
        open={open}
        trigger={trigger}
        closeOnDimmerClick={false}
        onOpen={() => this.setState({ open: true })}
        onClose={() => this.setState({ open: false })}>
        <Modal.Header>{this.isUpdate() ? `Edit "${collection.name}"` : 'New Collection'}</Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form noValidate id="edit-collection" error={!!error} onSubmit={this.onSubmit}>
              {error && <Message error content={error.message} />}
              {/* --- Generator: fields */}
              <Form.Input
                required
                type="text"
                name="name"
                label="Name"
                value={collection.name || ''}
                onChange={this.setField}
              />
              <Form.TextArea
                name="description"
                label="Description"
                value={collection.description || ''}
                onChange={this.setField}
              />
              {/* --- Generator: end */}
            </Form>
          </AutoFocus>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-collection"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
