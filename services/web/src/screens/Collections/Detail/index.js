import React from 'react';
import { Link } from 'react-router-dom';
import { Switch, Route } from 'react-router-dom';
import { Loader, Header } from 'semantic-ui-react';
import { Breadcrumbs } from 'components';
import { request } from 'utils/api';

import Overview from './Overview';

import Batches from './Batches';

export default class CollectionDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: null,
      error: null,
      loading: true,
      onSave: this.onSave,
    };
  }

  componentDidMount() {
    this.fetchCollection();
  }

  componentDidUpdate(lastProps) {
    const { id } = this.props.match.params;
    if (id !== lastProps.match.params.id) {
      this.fetchCollection();
    }
  }

  onSave = () => {
    this.fetchCollection();
  };

  async fetchCollection() {
    const { id } = this.props.match.params;
    try {
      this.setState({
        error: null,
        loading: true,
      });
      const { data } = await request({
        method: 'GET',
        path: `/1/collections/${id}`,
      });
      this.setState({
        collection: data,
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
          <Breadcrumbs link={<Link to="/collections">Collections</Link>} active="Not Found" />
          <Header content="Sorry that collection wasn't found." />
        </React.Fragment>
      );
    }
    return (
      <Switch>
        <Route exact path="/collections/:id" render={(props) => <Overview {...props} {...this.state} />} />
        {/* --- Generator: routes */}
        <Route exact path="/collections/:id/batches" render={(props) => <Batches {...props} {...this.state} />} />
        {/* <Route exact path="/collections/:id/stats" render={(props) => <Stats {...props} {...this.state} />} /> */}
        {/* --- Generator: end */}
      </Switch>
    );
  }
}
