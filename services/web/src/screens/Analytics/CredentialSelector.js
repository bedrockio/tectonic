import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { request } from 'utils/api';
import { useTectonicContext } from 'react-tectonic';

export default class AnalyticsOverview extends React.Component {
  state = {
    credentials: [],
    loading: false,
    error: null,
    selected: this.getSelect(),
  };

  context = useTectonicContext;

  getSelect() {
    if (!window.localStorage.getItem('accessCreditial')) {
      return;
    }
    let credential;
    try {
      credential = JSON.parse(window.localStorage.getItem('accessCreditial'));
    } catch (e) {
      return null;
    }
    return credential;
  }

  componentDidMount() {
    if (!this.state.selected) {
      this.fetchCredentials();
    }
  }

  async fetchCredentials() {
    this.setState({
      loading: true,
      error: null,
    });
    try {
      const { data } = await request({
        method: 'POST',
        path: '/1/access-credentials/search',
      });

      this.setState(
        {
          loading: false,
          credentials: data,
          selected: data[0],
        },
        () => {
          this.updateToken(this.state.selected);
        }
      );
    } catch (error) {
      this.setState({
        loading: false,
        error,
      });
    }
  }

  async updateToken(selected) {
    const { data } = await request({
      method: 'GET',
      path: `/1/access-credentials/${selected.id}`,
    });

    window.localStorage.setItem('token', data.token);
    window.localStorage.setItem('accessCreditial', JSON.stringify(data));
    //this.context.setToken(data.token);
  }

  getOptions() {
    return this.state.credentials.map((item) => {
      return {
        text: item.name,
        value: item.id,
      };
    });
  }

  render() {
    return (
      <Dropdown
        style={this.props.style}
        error={this.state.error}
        button
        onOpen={() => {
          this.fetchCredentials();
        }}
        loading={this.state.loading}
        className="icon"
        floating
        labeled
        icon="key"
        options={this.getOptions()}
        onChange={(e, { value }) => {
          this.setState(
            {
              selected: this.state.credentials.find((c) => c.id === value),
            },
            () => {
              this.updateToken(this.state.selected);
            }
          );
        }}
        search
        text={this.state.selected ? `Using "${this.state.selected.name}"` : 'Select A Credential'}
      />
    );
  }
}
