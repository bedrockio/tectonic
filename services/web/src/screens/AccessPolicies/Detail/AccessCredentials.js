import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Message, Loader, Button, Header } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Layout, Confirm, HelpTip, SearchProvider } from 'components';

import Filters from 'modals/Filters';

import Menu from './Menu';

@screen
export default class AccessPolicyAccessCredentials extends React.Component {
  onDataNeeded = async (params) => {
    const { policy } = this.props;
    return await request({
      method: 'POST',
      path: '/1/access-credentials/search',
      body: {
        ...params,
        accessPolicyId: policy.id,
      },
    });
  };

  render() {
    const { policy } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {policy ? (
          <SearchProvider onDataNeeded={this.onDataNeeded}>
            {({ items: accessCredentials, getSorted, setSort, filters, setFilters, reload }) => {
              return (
                <React.Fragment>
                  <Header as="h2">
                    <Layout horizontal center spread>
                      Access Credentials
                      <Layout.Group>
                        <Filters size="tiny" onSave={setFilters} filters={filters}>
                          <Filters.Text label="accessCredentialId" name="id" />
                        </Filters>
                      </Layout.Group>
                    </Layout>
                  </Header>
                  {accessCredentials.length === 0 ? (
                    <Message>No access credentials created yet</Message>
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
                            <HelpTip title="Created" text="This is the date and time the policy was created." />
                          </Table.HeaderCell>
                          <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {accessCredentials.map((accessCredential) => {
                          return (
                            <Table.Row key={accessCredential.id}>
                              {/* --- Generator: list-body-cells */}
                              <Table.Cell>
                                <Link to={`/access-credentials/${accessCredential.id}`}>{accessCredential.name}</Link>
                              </Table.Cell>
                              {/* --- Generator: end */}
                              <Table.Cell>{formatDateTime(accessCredential.createdAt)}</Table.Cell>
                              <Table.Cell textAlign="center">
                                {/* <EditAccessCredential
                                  accessCredential={accessCredential}
                                  trigger={<Button style={{ marginLeft: '20px' }} basic icon="edit" />}
                                  onSave={reload}
                                /> */}
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
        ) : (
          <Loader active>Loading</Loader>
        )}
      </React.Fragment>
    );
  }
}
