import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, Container } from 'semantic';
import Footer from 'components/Footer';
import { Layout } from 'components';
import Protected from 'components/Protected';
import Sidebar from './Sidebar';

import logo from 'assets/logo.svg';
import favicon from 'assets/favicon.svg';

export default class DashboardLayout extends React.Component {
  render() {
    return (
      <Sidebar>
        <Sidebar.Menu>
          <Layout style={{ height: '100%' }}>
            <NavLink style={{ margin: '5px 15px 15px 15px' }} to="/">
              <img height="38" src={logo} />
            </NavLink>
            <Layout vertical spread>
              <Layout.Group>
                <Sidebar.Header>Main Menu</Sidebar.Header>
              </Layout.Group>
              <Layout.Group grow overflow>
                <Protected endpoint="collections">
                  <Sidebar.Link to="/collections">
                    <Icon name="database" />
                    Collections
                  </Sidebar.Link>

                  <Sidebar.Link to="/access/credentials">
                    <Icon name="key" />
                    Access Credentials
                  </Sidebar.Link>

                  <Sidebar.Accordion active="/access">
                    <Sidebar.Link to="/access/policies">
                      <Icon name="file-alt" />
                      Access Policies
                    </Sidebar.Link>
                  </Sidebar.Accordion>

                  <Sidebar.Link to="/applications">
                    <Icon name="cube" />
                    Applications
                  </Sidebar.Link>
                </Protected>
              </Layout.Group>
              <Layout.Group>
                <Sidebar.Divider />

                <Protected endpoint="users">
                  <Sidebar.Link to="/users">
                    <Icon name="users" />
                    Users
                  </Sidebar.Link>
                </Protected>
                <Sidebar.Link to="/docs/getting-started">
                  <Icon name="terminal" />
                  Docs
                </Sidebar.Link>
                <Sidebar.Link to="/logout">
                  <Icon name="sign-out-alt" />
                  Log Out
                </Sidebar.Link>
              </Layout.Group>
            </Layout>
          </Layout>
        </Sidebar.Menu>
        <Sidebar.Content>
          <Sidebar.Mobile>
            <Layout horizontal spread center>
              <Layout.Group>
                <NavLink to="/">
                  <img src={favicon} height="15" />
                </NavLink>
              </Layout.Group>
              <Layout.Group>
                <Sidebar.Trigger>
                  <Icon name="bars" fitted />
                </Sidebar.Trigger>
              </Layout.Group>
            </Layout>
          </Sidebar.Mobile>
          <Container>
            <main>{this.props.children}</main>
            <Footer />
          </Container>
        </Sidebar.Content>
      </Sidebar>
    );
  }
}
