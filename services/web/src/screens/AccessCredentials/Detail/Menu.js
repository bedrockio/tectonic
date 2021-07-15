import React from 'react';
import { Link } from 'react-router-dom';
import { Divider, Button } from 'semantic-ui-react';
import { Breadcrumbs, Layout } from 'components';

import EditAccessCredential from 'modals/EditAccessCredential';
import ViewToken from 'modals/ViewToken';

export default ({ accessCredential, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/access/credentials">Access Credentials</Link>}
        active={accessCredential.name || 'Loading...'}
      />
      <Layout horizontal center spread>
        <h1>{accessCredential.name}</h1>
        <Layout.Group>
          <ViewToken
            endpoint="access-credentials"
            credential={accessCredential}
            trigger={<Button icon="key" content="Show Token" basic />}
          />
          <EditAccessCredential
            accessCredential={accessCredential}
            onSave={onSave}
            trigger={<Button primary icon="setting" content="Settings" />}
          />
        </Layout.Group>
      </Layout>

      <Divider hidden />
    </React.Fragment>
  );
};
