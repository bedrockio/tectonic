import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditDatalake from 'modals/EditDatalake';

export default ({ datalake, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs link={<Link to="/datalakes">Data Lakes</Link>} active={datalake.name || 'Loading...'}>
        <EditDatalake
          datalake={datalake}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/datalakes/${datalake.id}`} as={NavLink} exact />
        {/* --- Generator: menus */}
        <Menu.Item name="Collections" to={`/datalakes/${datalake.id}/collections`} as={NavLink} exact />
        <Menu.Item name="Batches" to={`/datalakes/${datalake.id}/batches`} as={NavLink} exact />
        {/* --- Generator: end */}
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
