import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditPolicy from 'modals/EditPolicy';

export default ({ policy, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/policies">Policies</Link>}
        active={policy.name || 'Loading...'}>
        <EditPolicy
          policy={policy}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item
          name="Overview"
          to={`/policies/${policy.id}`}
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
