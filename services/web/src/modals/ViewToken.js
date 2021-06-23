import React from 'react';
import { Loader, Modal, Message, Button } from 'semantic';
import { request } from 'utils/api';
import { modal } from 'helpers';
import CodeBlockText from 'components/CodeBlockText';
import CopyToClipboardButton from 'components/CopyToClipboardButton';

@modal
export default class ViewToken extends React.Component {
  state = {
    error: null,
    loading: false,
    token: null,
  };

  componentDidMount() {
    this.fetchToken();
  }

  async fetchToken() {
    const { credential, endpoint } = this.props;
    this.setState({
      error: null,
      loading: true,
    });
    try {
      const { data } = await request({
        method: 'GET',
        path: `/1/${endpoint}/${credential.id}/token`,
      });
      this.setState({
        token: data.token,
        error: null,
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
    const { credential } = this.props;
    const { loading, error, token } = this.state;
    return (
      <>
        <Modal.Header>{credential.name} Token</Modal.Header>
        <Modal.Content scrolling>
          <p>You can use this JWT token for access to Tectonic:</p>
          {loading && <Loader />}
          {error && <Message error content={error.message} />}
          {token && (
            <React.Fragment>
              <CodeBlockText text={token} />
              <CopyToClipboardButton fluid text={token} />
            </React.Fragment>
          )}
        </Modal.Content>
        <Modal.Actions></Modal.Actions>
      </>
    );
  }
}
