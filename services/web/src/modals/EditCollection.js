import React from 'react';
import { Modal, Form, Button, Message } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
import DateField from 'components/form-fields/Date';
import UploadsField from 'components/form-fields/Uploads';
import CurrencyField from 'components/form-fields/Currency';
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
          body: {
            ...collection,
            // --- Generator: refs
            datalake: this.props.datalake.id,
            // --- Generator: end
          },
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/collections',
          body: {
            ...collection,
            // --- Generator: refs
            datalake: this.props.datalake.id,
            // --- Generator: end
          },
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
        <Modal.Header>
          {this.isUpdate() ? `Edit "${collection.name}"` : 'New Collection'}
        </Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form
              noValidate
              id="edit-collection"
              error={!!error}
              onSubmit={this.onSubmit}>
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
              <Form.Checkbox
                name="isFeatured"
                label="Is Featured?"
                checked={collection.isFeatured || false}
                onChange={this.setCheckedField}
              />
              <CurrencyField
                name="priceUsd"
                label="Price"
                value={collection.priceUsd || ''}
                onChange={this.setField}
              />
              <DateField
                time
                name="expiresAt"
                value={collection.expiresAt}
                label="Expiration Date and Time"
                onChange={this.setField}
              />
              <Form.Dropdown
                name="sellingPoints"
                search
                selection
                multiple
                allowAdditions
                options={
                  collection.sellingPoints?.map((value) => {
                    return {
                      value,
                      text: value,
                    };
                  }) || []
                }
                label="Selling Points"
                onAddItem={(evt, { name, value }) => {
                  this.setField(evt, {
                    name,
                    value: [...(collection.sellingPoints || []), value],
                  });
                }}
                onChange={this.setField}
                value={collection.sellingPoints || []}
              />
              <UploadsField
                name="images"
                label="Images"
                value={collection.images || []}
                onChange={(data) => this.setField(null, data)}
                onError={(error) => this.setState({ error })}
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
