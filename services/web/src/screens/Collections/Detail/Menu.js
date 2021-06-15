import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditCollection from 'modals/EditCollection';

export default ({ collection, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs link={<Link to="/collections">Collections</Link>} active={collection.name || 'Loading...'}>
        <EditCollection
          collection={collection}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/collections/${collection.id}`} as={NavLink} exact />
        {/* --- Generator: menus */}
        <Menu.Item name="Batches" to={`/collections/${collection.id}/batches`} as={NavLink} exact />
        {/* <Menu.Item name="Stats" to={`/collections/${collection.id}/stats`} as={NavLink} exact /> */}
        {/* --- Generator: end */}
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
