import React from 'react';
import { Link } from 'react-router-dom';
import { Switch, Route } from 'react-router-dom';
import { Loader, Header } from 'semantic-ui-react';
import { Breadcrumbs } from 'components';
import { request } from 'utils/api';

import Overview from './Overview';

// --- Generator: imports

// --- Generator: end

export default class ApplicationCredentialDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      applicationCredential: null,
      error: null,
      loading: true,
      onSave: this.onSave,
    };
  }

  componentDidMount() {
    this.fetchApplicationCredential();
  }

  componentDidUpdate(lastProps) {
    const { id } = this.props.match.params;
    if (id !== lastProps.match.params.id) {
      this.fetchApplicationCredential();
    }
  }

  onSave = () => {
    this.fetchApplicationCredential();
  };

  async fetchApplicationCredential() {
    const { id } = this.props.match.params;
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'GET',
        path: `/1/application-credentials/${id}`,
      });
      this.setState({
        applicationCredential: data,
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
          <Breadcrumbs link={<Link to="/application-credentials">Application Credentials</Link>} active="Not Found" />
          <Header content="Sorry that application credential wasn't found." />
        </React.Fragment>
      );
    }
    return (
      <Switch>
        <Route exact path="/application-credentials/:id" render={(props) => <Overview {...props} {...this.state} />} />
        {/* --- Generator: routes */}
        {/* --- Generator: end */}
      </Switch>
    );
  }
}
