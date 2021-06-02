import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditAccessCredential from 'modals/EditAccessCredential';

export default ({ accessCredential, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/access-credentials">Access Credentials</Link>}
        active={accessCredential.name || 'Loading...'}>
        <EditAccessCredential
          accessCredential={accessCredential}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/access-credentials/${accessCredential.id}`} as={NavLink} exact />
        {/* <Menu.Item
          name="AccessPolicies"
          to={`/access-credentials/${accessCredential.id}/access-policies`}
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
