import React from 'react';
import {
  Table,
  Message,
  Loader,
  Image,
  Button,
  Header,
} from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { urlForUpload } from 'utils/uploads';
import { Layout, Confirm, HelpTip, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditCollection from 'modals/EditCollection';

import Menu from './Menu';

@screen
export default class DatalakeCollections extends React.Component {
  onDataNeeded = async (params) => {
    const { datalake } = this.props;
    return await request({
      method: 'POST',
      path: '/1/collections/search',
      body: {
        ...params,
        datalake: datalake.id,
      },
    });
  };

  render() {
    const { datalake } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {datalake ? (
          <SearchProvider onDataNeeded={this.onDataNeeded}>
            {({
              items: collections,
              filters,
              setFilters,
              getSorted,
              setSort,
              reload,
            }) => {
              return (
                <React.Fragment>
                  <Header as="h2">
                    <Layout horizontal center spread>
                      Collections
                      <Layout.Group>
                        <Filters
                          size="tiny"
                          onSave={setFilters}
                          filters={filters}>
                          <Filters.Text label="Name" name="name" />
                        </Filters>
                        <EditCollection
                          datalake={datalake}
                          onSave={reload}
                          trigger={
                            <Button
                              primary
                              size="tiny"
                              content="Add Collection"
                              icon="plus"
                            />
                          }
                        />
                      </Layout.Group>
                    </Layout>
                  </Header>
                  {collections.length === 0 ? (
                    <Message>No collections added yet</Message>
                  ) : (
                    <Table celled>
                      <Table.Header>
                        <Table.Row>
                          {/* --- Generator: list-header-cells */}
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('name')}
                            onClick={() => setSort('name')}>
                            Name
                          </Table.HeaderCell>
                          <Table.HeaderCell width={3}>
                            Description
                          </Table.HeaderCell>
                          <Table.HeaderCell width={1}>Id</Table.HeaderCell>
                          {/* --- Generator: end */}
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('createdAt')}
                            onClick={() => setSort('createdAt')}>
                            Created
                            <HelpTip
                              title="Created"
                              text="This is the date and time the item was created."
                            />
                          </Table.HeaderCell>
                          <Table.HeaderCell textAlign="center">
                            Actions
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {collections.map((collection) => {
                          return (
                            <Table.Row key={collection.id}>
                              {/* --- Generator: list-body-cells */}
                              <Table.Cell>{collection.name}</Table.Cell>
                              <Table.Cell>{collection.description}</Table.Cell>
                              <Table.Cell>{collection.id}</Table.Cell>
                              {/* --- Generator: end */}
                              <Table.Cell>
                                {formatDateTime(collection.createdAt)}
                              </Table.Cell>
                              <Table.Cell textAlign="center">
                                <EditCollection
                                  datalake={datalake}
                                  collection={collection}
                                  onSave={reload}
                                  trigger={
                                    <Button
                                      style={{ marginLeft: '20px' }}
                                      basic
                                      icon="edit"
                                    />
                                  }
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
        ) : (
          <Loader active>Loading</Loader>
        )}
      </React.Fragment>
    );
  }
}
