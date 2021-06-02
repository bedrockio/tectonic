import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Divider, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';

import EditApplicationCredential from 'modals/EditApplicationCredential';

export default ({ applicationCredential, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/application-credentials">Application Credentials</Link>}
        active={applicationCredential.name || 'Loading...'}>
        <EditApplicationCredential
          applicationCredential={applicationCredential}
          onSave={onSave}
          trigger={<Button primary icon="setting" content="Settings" />}
        />
      </Breadcrumbs>
      <Divider hidden />
      <Menu tabular>
        <Menu.Item name="Overview" to={`/application-credentials/${applicationCredential.id}`} as={NavLink} exact />
      </Menu>
      <Divider hidden />
    </React.Fragment>
  );
};
