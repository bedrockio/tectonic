import React from 'react';
import { Link } from 'react-router-dom';
import { Switch, Route } from 'react-router-dom';
import { Loader, Header } from 'semantic-ui-react';
import { Breadcrumbs } from 'components';
import { request } from 'utils/api';

import Overview from './Overview';

// --- Generator: imports
import Collections from './Collections';
import Batches from './Batches';
// --- Generator: end

export default class DatalakeDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datalake: null,
      error: null,
      loading: true,
      onSave: this.onSave,
    };
  }

  componentDidMount() {
    this.fetchDatalake();
  }

  componentDidUpdate(lastProps) {
    const { id } = this.props.match.params;
    if (id !== lastProps.match.params.id) {
      this.fetchDatalake();
    }
  }

  onSave = () => {
    this.fetchDatalake();
  };

  async fetchDatalake() {
    const { id } = this.props.match.params;
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'GET',
        path: `/1/datalakes/${id}`,
      });
      this.setState({
        datalake: data,
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
          <Breadcrumbs
            link={<Link to="/datalakes">Datalakes</Link>}
            active="Not Found"
          />
          <Header content="Sorry that datalake wasn't found." />
        </React.Fragment>
      );
    }
    return (
      <Switch>
        <Route
          exact
          path="/datalakes/:id"
          render={(props) => <Overview {...props} {...this.state} />}
        />
        {/* --- Generator: routes */}
        <Route
          exact
          path="/datalakes/:id/collections"
          render={(props) => <Collections {...props} {...this.state} />}
        />
        <Route
          exact
          path="/datalakes/:id/batches"
          render={(props) => <Batches {...props} {...this.state} />}
        />
        {/* --- Generator: end */}
      </Switch>
    );
  }
}
