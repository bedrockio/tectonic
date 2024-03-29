import React from 'react';
import { withSession } from 'stores';
import { NavLink, Link } from 'react-router-dom';
import { Container, Dropdown, Icon, Menu } from 'semantic-ui-react';
import logo from 'assets/favicon.svg';
import Protected from 'components/Protected';

@withSession
export default class Header extends React.Component {
  render() {
    const { user } = this.context;
    if (!user) {
      return null;
    }
    return (
      <header>
        <Menu inverted fixed="top">
          <Container>
            <Menu.Item as={Link} to="/">
              <img style={{ width: '30px' }} className="logo" src={`${logo}`} />
            </Menu.Item>
            <Menu.Item as={NavLink} to="/collections">
              Collections
            </Menu.Item>
            <Menu.Item as={NavLink} to="/access-policies">
              Access Policies
            </Menu.Item>
            <Menu.Item as={NavLink} to="/access-credentials">
              Access Credentials
            </Menu.Item>
            <Menu.Item as={NavLink} to="/application-credentials">
              Application Credentials
            </Menu.Item>
            <Menu.Menu position="right">
              <Dropdown
                className="account"
                item
                trigger={
                  <span>
                    <Icon name="user" /> {user?.name}
                  </span>
                }>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/settings">
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/docs/guide">
                    API Docs
                  </Dropdown.Item>
                  <Protected endpoint="events">
                    <Dropdown.Item as={Link} to="/users">
                      Users
                    </Dropdown.Item>
                  </Protected>
                  <Dropdown.Item as={Link} to="/logout">
                    Log Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Menu>
          </Container>
        </Menu>
      </header>
    );
  }
}
