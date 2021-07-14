import React from 'react';
import { Link } from 'react-router-dom';
import { Divider, Button } from 'semantic-ui-react';
import { Breadcrumbs, Layout } from 'components';

import EditApplicationCredential from 'modals/EditApplicationCredential';
import ViewToken from 'modals/ViewToken';

export default ({ applicationCredential, onSave }) => {
  return (
    <React.Fragment>
      <Breadcrumbs
        link={<Link to="/applications">Application Credentials</Link>}
        active={applicationCredential.name || 'Loading...'}>
        <Layout horizontal center spread>
          <h1>{applicationCredential.name}</h1>
          <Layout.Group>
            <ViewToken
              endpoint="application-credentials"
              credential={applicationCredential}
              trigger={<Button icon="key" content="Show Token" basic />}
            />
            <EditApplicationCredential
              applicationCredential={applicationCredential}
              onSave={onSave}
              trigger={<Button primary icon="setting" content="Settings" />}
            />
          </Layout.Group>
        </Layout>
      </Breadcrumbs>
      <Divider hidden />
    </React.Fragment>
  );
};
