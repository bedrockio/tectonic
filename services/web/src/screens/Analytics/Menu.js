import React from 'react';
import { Link } from 'react-router-dom';
import { Divider, Menu } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { Breadcrumbs } from 'components';
import CredentialSelector from './CredentialSelector';

export default () => (
  <React.Fragment>
    <Breadcrumbs link={<Link to="/analytics">Analytics</Link>} active={'Purchases' || 'Loading...'}></Breadcrumbs>

    <Divider hidden />

    <Menu tabular>
      <Menu.Item exact name="Overview" to={`/analytics`} as={NavLink} />
      <Menu.Item exact name="Consumptions" to={`/analytics/consumptions`} as={NavLink} />
      <Menu.Item exact name="Staff" to={`/analytics/staff`} as={NavLink} />
      {/* <Menu.Item exact name="Members" to={`/analytics/members`} as={NavLink} /> */}
    </Menu>
    <CredentialSelector style={{ float: 'right' }} />

    <Divider hidden />
  </React.Fragment>
);
