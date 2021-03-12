import React from 'react';
import { withSession } from 'stores';
import { Container } from 'semantic-ui-react';
import { Layout } from './Layout';
import tectonic from 'assets/tectonic.svg';

@withSession
export default class Footer extends React.Component {

  render() {
    const { user } = this.context;
    if (!user) {
      return null;
    }
    return (
      <footer>
        <Container>
          <Layout horizontal center right>
            Built with&nbsp;&nbsp;
            <img width="112" height="24" src={tectonic} />
          </Layout>
        </Container>
      </footer>
    );
  }
}
