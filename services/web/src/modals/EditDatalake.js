import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';

// --- Generator: imports
import UploadsField from 'components/form-fields/Uploads';
//import CountriesField from 'components/form-fields/Countries';
import CategoriesField from 'components/form-fields/Categories';
// --- Generator: end

export default class EditDatalake extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      loading: false,
      datalake: props.datalake || {},
    };
  }

  componentDidUpdate(lastProps) {
    const { datalake } = this.props;
    if (datalake && datalake !== lastProps.datalake) {
      this.setState({
        datalake,
      });
    }
  }

  isUpdate() {
    return !!this.props.datalake;
  }

  setField = (evt, { name, value }) => {
    this.setState({
      datalake: {
        ...this.state.datalake,
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
      const { datalake } = this.state;
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/datalakes/${datalake.id}`,
          body: datalake,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/datalakes',
          body: datalake,
        });
        this.setState({
          datalake: {},
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
    const { datalake, open, loading, error } = this.state;
    return (
      <Modal
        closeIcon
        open={open}
        trigger={trigger}
        closeOnDimmerClick={false}
        onOpen={() => this.setState({ open: true })}
        onClose={() => this.setState({ open: false })}>
        <Modal.Header>
          {this.isUpdate() ? `Edit "${datalake.name}"` : 'New Datalake'}
        </Modal.Header>
        <Modal.Content scrolling>
          <AutoFocus>
            <Form
              noValidate
              id="edit-datalake"
              error={!!error}
              onSubmit={this.onSubmit}>
              {error && <Message error content={error.message} />}
              {/* --- Generator: fields */}
              <Form.Input
                required
                type="text"
                name="name"
                label="Name"
                value={datalake.name || ''}
                onChange={this.setField}
              />
              <Form.TextArea
                name="description"
                label="Description"
                type="text"
                value={datalake.description || ''}
                onChange={this.setField}
              />
              <CategoriesField
                name="categories"
                value={datalake.categories || []}
                onChange={this.setField}
              />
              <UploadsField
                name="images"
                label="Images"
                value={datalake.images || []}
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
            form="edit-datalake"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
