import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditAccessPolicy from 'modals/EditAccessPolicy';

export default ({ policy, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs link={<Link to="/access-policies">Access Policies</Link>} active={policy.name || 'Loading...'}>
        <EditAccessPolicy
          policy={policy}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/access-policies/${policy.id}`} as={NavLink} exact />
        <Menu.Item
          name="AccessCredentials"
          to={`/access-policies/${policy.id}/access-credentials`}
          as={NavLink}
          exact
        />
        {/* --- Generator: menus */}
        {/* --- Generator: end */}
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
