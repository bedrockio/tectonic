import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs, Layout } from 'components';

import EditAccessCredential from 'modals/EditAccessCredential';

export default ({ accessCredential, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/access/credentials">Access Credentials</Link>}
        active={accessCredential.name || 'Loading...'}
      />
      <Layout horizontal center spread>
        <h1>{accessCredential.name} Application Credentials</h1>
        <Layout.Group>
          <EditAccessCredential
            accessCredential={accessCredential}
            onSave={onSave}
            trigger={<Button primary icon="setting" content="Settings" />}
          />
        </Layout.Group>
      </Layout>

      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/access/credentials/${accessCredential.id}`} as={NavLink} exact />
        {/* <Menu.Item
          name="AccessPolicies"
          to={`/access/credentials/${accessCredential.id}/access-policies`}
          as={NavLink}
          exact
        /> */}
        {/* --- Generator: menus */}
        {/* --- Generator: end */}
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
