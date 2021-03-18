import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditDatalake from 'modals/EditDatalake';

// --- Generator: list-imports
import { getData } from 'country-list';
const countries = getData().map(({ code, name }) => ({
  value: code,
  text: name,
  key: code,
}));
// --- Generator: end

@screen
export default class DatalakeList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/datalakes/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({
          items: datalakes,
          getSorted,
          setSort,
          filters,
          setFilters,
          reload,
        }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Datalakes">
                <Filters onSave={setFilters} filters={filters}>
                  {/* --- Generator: filters */}
                  <Filters.Text label="Name" name="name" />
                  <Filters.Dropdown
                    label="Country"
                    name="country"
                    options={countries}
                    search
                  />
                  {/* --- Generator: end */}
                </Filters>
                <EditDatalake
                  trigger={
                    <Button primary content="New Datalake" icon="plus" />
                  }
                  onSave={reload}
                />
              </Breadcrumbs>
              <Divider hidden />
              {datalakes.length === 0 ? (
                <Message>No datalakes created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      {/* --- Generator: list-header-cells */}
                      <Table.HeaderCell
                        width={3}
                        onClick={() => setSort('name')}
                        sorted={getSorted('name')}>
                        Name
                      </Table.HeaderCell>
                      <Table.HeaderCell width={3}>Description</Table.HeaderCell>
                      {/* --- Generator: end */}
                      <Table.HeaderCell
                        onClick={() => setSort('createdAt')}
                        sorted={getSorted('createdAt')}>
                        Created
                        <HelpTip
                          title="Created"
                          text="This is the date and time the datalake was created."
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">
                        Actions
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {datalakes.map((datalake) => {
                      return (
                        <Table.Row key={datalake.id}>
                          {/* --- Generator: list-body-cells */}
                          <Table.Cell>
                            <Link to={`/datalakes/${datalake.id}`}>
                              {datalake.name}
                            </Link>
                          </Table.Cell>
                          <Table.Cell>{datalake.description}</Table.Cell>
                          {/* --- Generator: end */}
                          <Table.Cell>
                            {formatDateTime(datalake.createdAt)}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditDatalake
                              datalake={datalake}
                              trigger={
                                <Button
                                  style={{ marginLeft: '20px' }}
                                  basic
                                  icon="edit"
                                />
                              }
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${datalake.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/datalakes/${datalake.id}`,
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
