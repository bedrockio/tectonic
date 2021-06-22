import React from 'react';
import { Link } from 'react-router-dom';
import { Switch, Route } from 'react-router-dom';
import { Loader, Header } from 'semantic-ui-react';
import { Breadcrumbs } from 'components';
import { request } from 'utils/api';

import Overview from './Overview';

// --- Generator: imports

// --- Generator: end

export default class AccessCredentialDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessCredential: null,
      error: null,
      loading: true,
      onSave: this.onSave,
    };
  }

  componentDidMount() {
    this.fetchAccessCredential();
  }

  componentDidUpdate(lastProps) {
    const { id } = this.props.match.params;
    if (id !== lastProps.match.params.id) {
      this.fetchAccessCredential();
    }
  }

  onSave = () => {
    this.fetchAccessCredential();
  };

  async fetchAccessCredential() {
    const { id } = this.props.match.params;
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'GET',
        path: `/1/access-credentials/${id}`,
      });
      this.setState({
        accessCredential: data,
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
          <Breadcrumbs link={<Link to="/access/credentials">Access Credentials</Link>} active="Not Found" />
          <Header content="Sorry that access credential wasn't found." />
        </React.Fragment>
      );
    }
    return (
      <Switch>
        <Route exact path="/access/credentials/:id" render={(props) => <Overview {...props} {...this.state} />} />
        {/* --- Generator: routes */}
        {/* --- Generator: end */}
      </Switch>
    );
  }
}
