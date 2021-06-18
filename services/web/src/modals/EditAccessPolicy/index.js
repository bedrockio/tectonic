import React from 'react';
import { Form, Modal, Message, Button } from 'semantic-ui-react';
import { request } from 'utils/api';

import CollectionPolicy from './CollectionPolicy';
import { modal } from 'helpers';

@modal
export default class EditAccessPolicy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      policy: props.policy || {
        collections: [],
      },
    };
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
    this.setState({
      error: null,
      loading: true,
    });
    const { policy } = this.state;
    try {
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
    const { policy, loading, error } = this.state;

    return (
      <>
        <Modal.Header>{this.isUpdate() ? `Edit Access Policy "${policy.name}"` : 'New Access Policy'}</Modal.Header>
        <Modal.Content scrolling>
          <Form noValidate id="edit-policy" error={!!error}>
            {error && <Message error content={error.message} />}

            <Form.Input
              required
              type="text"
              name="name"
              label="Name"
              value={policy.name || ''}
              onChange={this.setField}
            />

            <CollectionPolicy
              collections={policy.collections}
              onChange={(collections) => {
                this.setState({
                  policy: {
                    ...policy,
                    collections,
                  },
                });
              }}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-policy"
            loading={loading}
            disabled={loading}
            onClick={this.onSubmit}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </>
    );
  }
}
