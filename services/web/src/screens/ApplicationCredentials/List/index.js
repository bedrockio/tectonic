import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditApplicationCredential from 'modals/EditApplicationCredential';

// --- Generator: list-imports
// --- Generator: end

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
              <Breadcrumbs active="Application Credentials">
                <Filters onSave={setFilters} filters={filters}>
                  {/* --- Generator: filters */}
                  <Filters.Text label="Name" name="name" />
                  {/* --- Generator: end */}
                </Filters>
                <EditApplicationCredential
                  trigger={<Button primary content="New Application Credential" icon="plus" />}
                  onSave={reload}
                />
              </Breadcrumbs>
              <Divider hidden />
              {applicationCredentials.length === 0 ? (
                <Message>No application credentials created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      {/* --- Generator: list-header-cells */}
                      <Table.HeaderCell width={10} onClick={() => setSort('name')} sorted={getSorted('name')}>
                        Name
                      </Table.HeaderCell>
                      {/* --- Generator: end */}
                      <Table.HeaderCell onClick={() => setSort('createdAt')} sorted={getSorted('createdAt')}>
                        Created
                        <HelpTip title="Created" text="This is the date and time the credential was created." />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {applicationCredentials.map((applicationCredential) => {
                      return (
                        <Table.Row key={applicationCredential.id}>
                          {/* --- Generator: list-body-cells */}
                          <Table.Cell>
                            <Link to={`/application-credentials/${applicationCredential.id}`}>
                              {applicationCredential.name}
                            </Link>
                          </Table.Cell>
                          {/* --- Generator: end */}
                          <Table.Cell>{formatDateTime(applicationCredential.createdAt)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditApplicationCredential
                              applicationCredential={applicationCredential}
                              trigger={<Button style={{ marginLeft: '20px' }} basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${applicationCredential.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
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
