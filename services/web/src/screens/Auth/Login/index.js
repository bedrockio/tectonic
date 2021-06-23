import React from 'react';
import { request } from 'utils/api';
import { Segment } from 'semantic';
import { withSession } from 'stores';
import { screen } from 'helpers';

import PageCenter from 'components/PageCenter';
import LogoTitle from 'components/LogoTitle';

import LoginForm from './Form';

@screen
@withSession
export default class Login extends React.Component {
  static layout = 'none';

  state = {
    error: null,
    loading: false,
  };

  onSubmit = async (body) => {
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'POST',
        path: '/1/auth/login',
        body,
      });
      this.context.setToken(data.token);
      await this.context.loadUser();
      this.props.history.push('/');
    } catch (error) {
      this.setState({
        error,
        loading: false,
      });
    }
  };

  render() {
    const { error, loading } = this.state;
    return (
      <PageCenter>
        <LogoTitle title="Login" />
        <Segment.Group>
          <Segment padded>
            <LoginForm onSubmit={this.onSubmit} error={error} loading={loading} />
          </Segment>
        </Segment.Group>
      </PageCenter>
    );
  }
}
