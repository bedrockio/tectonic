import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider, Layout } from 'components';

import Filters from 'modals/Filters';
import EditAccessPolicy from 'modals/EditAccessPolicy';

// --- Generator: list-imports
// --- Generator: end

@screen
export default class AccessPolicyList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/access-policies/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({ items: accessPolicies, getSorted, setSort, filters, setFilters, reload }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Access Policies" />
              <Layout horizontal center spread>
                <h1>Access Policies</h1>
                <Layout.Group>
                  <Filters onSave={setFilters} filters={filters}>
                    {/* --- Generator: filters */}
                    <Filters.Text label="Name" name="name" />
                    {/* --- Generator: end */}
                  </Filters>
                  <EditAccessPolicy
                    trigger={<Button primary content="New Access Policy" icon="plus" />}
                    onSave={reload}
                  />
                </Layout.Group>
              </Layout>

              <p>
                An Access Policy specifies what data can be accessed in one or more collections. Access Policies are
                used by the Access Credentials to manage who has access to what data.
              </p>

              {accessPolicies.length === 0 ? (
                <Message>No access policies created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      {/* --- Generator: list-header-cells */}
                      <Table.HeaderCell width={10} onClick={() => setSort('name')} sorted={getSorted('name')}>
                        Name
                        <HelpTip
                          title="Name"
                          text="Names are unique and can only be composed of lowercase alpha numeric characters and dashes"
                        />
                      </Table.HeaderCell>
                      {/* --- Generator: end */}
                      <Table.HeaderCell onClick={() => setSort('createdAt')} sorted={getSorted('createdAt')}>
                        Created
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {accessPolicies.map((policy) => {
                      return (
                        <Table.Row key={policy.id}>
                          {/* --- Generator: list-body-cells */}
                          <Table.Cell>
                            <Link to={`/access/policies/${policy.id}`}>{policy.name}</Link>
                          </Table.Cell>
                          {/* --- Generator: end */}
                          <Table.Cell>{formatDateTime(policy.createdAt)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditAccessPolicy
                              policy={policy}
                              trigger={<Button style={{ marginLeft: '20px' }} basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${policy.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/access-policies/${policy.id}`,
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
