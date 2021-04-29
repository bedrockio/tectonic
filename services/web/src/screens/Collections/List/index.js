import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditCollection from 'modals/EditCollection';

// --- Generator: list-imports
// --- Generator: end

@screen
export default class CollectionList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/collections/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({ items: collections, getSorted, setSort, filters, setFilters, reload }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Collections">
                <Filters onSave={setFilters} filters={filters}>
                  {/* --- Generator: filters */}
                  <Filters.Text label="Name" name="name" />
                  {/* --- Generator: end */}
                </Filters>
                <EditCollection trigger={<Button primary content="New Collection" icon="plus" />} onSave={reload} />
              </Breadcrumbs>
              <Divider hidden />
              {collections.length === 0 ? (
                <Message>No collections created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      {/* --- Generator: list-header-cells */}
                      <Table.HeaderCell width={3} onClick={() => setSort('name')} sorted={getSorted('name')}>
                        Name
                      </Table.HeaderCell>
                      <Table.HeaderCell width={6}>Description</Table.HeaderCell>
                      {/* --- Generator: end */}
                      <Table.HeaderCell onClick={() => setSort('createdAt')} sorted={getSorted('createdAt')}>
                        Created
                        <HelpTip title="Created" text="This is the date and time the collection was created." />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {collections.map((collection) => {
                      return (
                        <Table.Row key={collection.id}>
                          {/* --- Generator: list-body-cells */}
                          <Table.Cell>
                            <Link to={`/collections/${collection.id}`}>{collection.name}</Link>
                          </Table.Cell>
                          <Table.Cell>{collection.description}</Table.Cell>
                          {/* --- Generator: end */}
                          <Table.Cell>{formatDateTime(collection.createdAt)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditCollection
                              collection={collection}
                              trigger={<Button style={{ marginLeft: '20px' }} basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${collection.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/collections/${collection.id}`,
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
