import React from 'react';
import { Modal, Form, Button, Message } from 'semantic';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';
import { modal } from 'helpers';

// --- Generator: imports
// --- Generator: end

@modal
export default class EditCollection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      collection: props.collection || {},
    };
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
    this.setState({
      error: null,
      loading: true,
    });

    const { collection } = this.state;
    try {
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
    const { collection, loading, error } = this.state;
    return (
      <>
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
      </>
    );
  }
}
