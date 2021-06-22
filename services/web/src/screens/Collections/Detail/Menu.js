import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs, Layout } from 'components';

import EditCollection from 'modals/EditCollection';

export default ({ collection, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs link={<Link to="/collections">Collections</Link>} active={collection.name || 'Loading...'} />

      <Layout horizontal center spread>
        <h1>{collection.name}</h1>
        <Layout.Group>
          <EditCollection
            collection={collection}
            onSave={onSave}
            trigger={<Button primary icon="setting" content="Settings" />}
          />
        </Layout.Group>
      </Layout>

      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/collections/${collection.id}`} as={NavLink} exact />
        <Menu.Item name="Batches" to={`/collections/${collection.id}/batches`} as={NavLink} exact />
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
