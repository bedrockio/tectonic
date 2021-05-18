import React from 'react';
import { Link } from 'react-router-dom';
import { Switch, Route } from 'react-router-dom';
import { Loader, Header } from 'semantic-ui-react';
import { Breadcrumbs } from 'components';
import { request } from 'utils/api';

import Overview from './Overview';

// --- Generator: imports
import AccessCredentials from './AccessCredentials';
// --- Generator: end

export default class AccessPolicyDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      policy: null,
      error: null,
      loading: true,
      onSave: this.onSave,
    };
  }

  componentDidMount() {
    this.fetchPolicy();
  }

  componentDidUpdate(lastProps) {
    const { id } = this.props.match.params;
    if (id !== lastProps.match.params.id) {
      this.fetchPolicy();
    }
  }

  onSave = () => {
    this.fetchPolicy();
  };

  async fetchPolicy() {
    const { id } = this.props.match.params;
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'GET',
        path: `/1/access-policies/${id}`,
      });
      this.setState({
        policy: data,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error,
        loading: false,
      });
    }
  }

  render() {
    const { loading, error } = this.state;
    if (loading) {
      return <Loader active>Loading</Loader>;
    } else if (error) {
      return (
        <React.Fragment>
          <Breadcrumbs link={<Link to="/access-policies">Access Policies</Link>} active="Not Found" />
          <Header content="Sorry that policy wasn't found." />
        </React.Fragment>
      );
    }
    return (
      <Switch>
        <Route exact path="/access-policies/:id" render={(props) => <Overview {...props} {...this.state} />} />
        {/* --- Generator: routes */}
        <Route
          exact
          path="/access-policies/:id/access-credentials"
          render={(props) => <AccessCredentials {...props} {...this.state} />}
        />
        {/* --- Generator: end */}
      </Switch>
    );
  }
}
