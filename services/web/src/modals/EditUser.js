import React from 'react';
import { Form, Modal, Message, Button } from 'semantic';
import { request } from 'utils/api';
import AutoFocus from 'components/AutoFocus';
import Roles from 'components/form-fields/Roles';
import { modal } from 'helpers';

@modal
export default class EditUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      touched: false,
      loading: false,
      error: null,
      user: props.user || {},
    };
  }

  isUpdate() {
    return !!this.props.user;
  }

  setField(name, value) {
    this.setState({
      user: {
        ...this.state.user,
        [name]: value,
      },
    });
  }

  onSubmit = async () => {
    const { user } = this.state;
    this.setState({
      loading: true,
      touched: true,
    });

    try {
      if (this.isUpdate()) {
        await request({
          method: 'PATCH',
          path: `/1/users/${user.id}`,
          body: user,
        });
      } else {
        await request({
          method: 'POST',
          path: '/1/users',
          body: user,
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
    const { user, touched, loading, error } = this.state;
    return (
      <>
        <Modal.Header>{this.isUpdate() ? `Edit "${user.name}"` : 'New User'}</Modal.Header>
        <Modal.Content>
          <AutoFocus>
            <Form id="edit-user" onSubmit={this.onSubmit} error={touched && error}>
              {error && <Message error content={error.message} />}
              <Form.Input
                value={user.name || ''}
                label="Name"
                required
                type="text"
                onChange={(e, { value }) => this.setField('name', value)}
              />
              <Form.Input
                value={user.email || ''}
                required
                type="email"
                label="Email"
                onChange={(e, { value }) => this.setField('email', value)}
              />
              {!this.isUpdate() && (
                <Form.Input
                  required
                  label="Password"
                  value={user.password || ''}
                  onChange={(e, { value }) => this.setField('password', value)}
                />
              )}

              <Roles value={user.roles || []} onChange={(value) => this.setField('roles', value)} />
            </Form>
          </AutoFocus>
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            form="edit-user"
            loading={loading}
            disabled={loading}
            content={this.isUpdate() ? 'Update' : 'Create'}
          />
        </Modal.Actions>
      </>
    );
  }
}
