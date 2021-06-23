import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider, Layout } from 'components';

import Filters from 'modals/Filters';
import EditApplicationCredential from 'modals/EditApplicationCredential';
import ViewToken from 'modals/ViewToken';

@screen
export default class ApplicationCredentialsList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/application-credentials/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({ items: applicationCredentials, getSorted, setSort, filters, setFilters, reload }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Applications" />
              <Layout horizontal center spread>
                <h1>Applications</h1>
                <Layout.Group>
                  <Filters onSave={setFilters} filters={filters}>
                    {/* --- Generator: filters */}
                    <Filters.Text label="Name" name="name" />
                    {/* --- Generator: end */}
                  </Filters>
                  <EditApplicationCredential
                    trigger={<Button primary content="New Application" icon="plus" />}
                    onSave={reload}
                  />
                </Layout.Group>
              </Layout>

              <p>
                An Application has a long term token that allows your backend to have administrative access to Tectonic.
                Using an Application token you can ingest data, create Access Credentials, Access Policies, or manage
                Collections.
              </p>

              {applicationCredentials.length === 0 ? (
                <Message>No application credentials created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell width={3} onClick={() => setSort('name')} sorted={getSorted('name')}>
                        Name
                        <HelpTip
                          title="Name"
                          text="Names are unique and can only be composed of lowercase alpha numeric characters and dashes"
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell width={3}>
                        Token
                        <HelpTip
                          title="Token"
                          text="This is a JSON Web Token that allows you administrative access to this Tectonic instance"
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => setSort('createdAt')} sorted={getSorted('createdAt')}>
                        Created
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {applicationCredentials.map((applicationCredential) => {
                      return (
                        <Table.Row key={applicationCredential.id}>
                          <Table.Cell>
                            <Link to={`/applications/${applicationCredential.id}`}>{applicationCredential.name}</Link>
                          </Table.Cell>
                          <Table.Cell>
                            <ViewToken
                              endpoint="application-credentials"
                              credential={applicationCredential}
                              trigger={<Button icon="key" content="Show Token" basic />}
                            />
                          </Table.Cell>
                          <Table.Cell>{formatDateTime(applicationCredential.createdAt)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditApplicationCredential
                              applicationCredential={applicationCredential}
                              trigger={<Button style={{ marginLeft: '20px' }} basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete &amp; Revoke"
                              header={`Delete and revoke "${applicationCredential.name}"?`}
                              content="Are you sure you want to delete and revoke this credential? API access will no longer be possible by this Application."
                              trigger={<Button basic icon="ban" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/application-credentials/${applicationCredential.id}`,
                                });
                                reload();
                              }}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              )}
            </React.Fragment>
          );
        }}
      </SearchProvider>
    );
  }
}
