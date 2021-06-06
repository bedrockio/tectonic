import React from 'react';
import { request } from 'utils/api';
import { Message } from 'semantic-ui-react';
import { hasDifferentParams } from 'utils/visualizations';

export default class Stats extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null,
  };
  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps) {
    if (hasDifferentParams(prevProps, this.props)) {
      this.fetch(this.props);
    }
  }

  fetch() {
    const { index, fields, filter } = this.props;
    const body = {
      index,
      fields,
      filter,
    };
    request({
      method: 'POST',
      path: '/1/admin-analytics/stats',
      body,
    })
      .then((data) => {
        this.setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        this.setState({ error, loading: false });
      });
  }

  render() {
    const { loading, error, data } = this.state;
    if (loading) return <p>loading</p>;
    if (error) return <Message error content={error.message} />;
    return this.props.children(data);
  }
}