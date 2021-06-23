import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider, Layout } from 'components';

import Filters from 'modals/Filters';
import EditAccessCredential from 'modals/EditAccessCredential';
import ViewToken from 'modals/ViewToken';

@screen
export default class AccessCredentialsList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/access-credentials/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({ items: accessCredentials, getSorted, setSort, filters, setFilters, reload }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Access Credentials" />
              <Layout horizontal center spread>
                <h1>Access Credentials</h1>
                <Layout.Group>
                  <Filters onSave={setFilters} filters={filters}>
                    {/* --- Generator: filters */}
                    <Filters.Text label="Name" name="name" />
                    {/* --- Generator: end */}
                  </Filters>
                  <EditAccessCredential
                    trigger={<Button primary content="New Access Credential" icon="plus" />}
                    onSave={reload}
                  />
                </Layout.Group>
              </Layout>

              <p>
                An Access Credential can be used to access one or more Collections. It's recommended that you create a
                unique Access Credential for each of your users or accounts. Access Credentials can be revoked at any
                time for a user and allow you to restrict read or write access to your Collections.
              </p>

              {accessCredentials.length === 0 ? (
                <Message>No access credentials created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      {/* --- Generator: list-header-cells */}
                      <Table.HeaderCell width={5} onClick={() => setSort('name')} sorted={getSorted('name')}>
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
                          text="This is a JSON Web Token that allows access to this Tectonic instance based on the policy configured"
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell width={5}>
                        Policy
                        <HelpTip title="Access Policy" text="The Access Policy attached to this Access Credential" />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {accessCredentials.map((accessCredential) => {
                      return (
                        <Table.Row key={accessCredential.id}>
                          <Table.Cell>
                            <Link to={`/access/credentials/${accessCredential.id}`}>{accessCredential.name}</Link>
                          </Table.Cell>
                          <Table.Cell>
                            <ViewToken
                              endpoint="access-credentials"
                              credential={accessCredential}
                              trigger={<Button icon="key" content="Show Token" basic />}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Link to={`/access/policies/${accessCredential.accessPolicy.id}`}>
                              {accessCredential.accessPolicy.name}
                            </Link>
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditAccessCredential
                              accessCredential={accessCredential}
                              trigger={<Button basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${accessCredential.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/access-credentials/${accessCredential.id}`,
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
