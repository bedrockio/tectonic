import React from 'react';
import { Table, Message, Loader, Button, Header } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Layout, Confirm, HelpTip, SearchProvider } from 'components';

import Filters from 'modals/Filters';

import Menu from './Menu';

@screen
export default class DatalakeBatches extends React.Component {
  onDataNeeded = async (params) => {
    const { datalake } = this.props;
    return await request({
      method: 'POST',
      path: '/1/batches/search',
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
          <SearchProvider
            sort={{ order: 'desc', field: 'ingestedAt' }}
            onDataNeeded={this.onDataNeeded}>
            {({
              items: batches,
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
                      Batches
                      <Layout.Group>
                        <Filters
                          size="tiny"
                          onSave={setFilters}
                          filters={filters}>
                          <Filters.Text label="BatchId" name="id" />
                        </Filters>
                      </Layout.Group>
                    </Layout>
                  </Header>
                  {batches.length === 0 ? (
                    <Message>No batches added yet</Message>
                  ) : (
                    <Table celled>
                      <Table.Header>
                        <Table.Row>
                          {/* --- Generator: list-header-cells */}
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('id')}
                            onClick={() => setSort('id')}>
                            BatchId
                          </Table.HeaderCell>
                          <Table.HeaderCell width={1}>
                            NumEvents
                          </Table.HeaderCell>
                          <Table.HeaderCell width={3}>RawUrl</Table.HeaderCell>
                          <Table.HeaderCell width={1}>
                            memorySize
                          </Table.HeaderCell>
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('ingestedAt')}
                            onClick={() => setSort('ingestedAt')}>
                            IngestedAt
                            <HelpTip
                              title="IngestedAt"
                              text="This is the date and time the batch was ingested."
                            />
                          </Table.HeaderCell>
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
                        {batches.map((batch) => {
                          return (
                            <Table.Row key={batch.id}>
                              {/* --- Generator: list-body-cells */}
                              <Table.Cell>{batch.id}</Table.Cell>
                              <Table.Cell>{batch.numEvents}</Table.Cell>
                              <Table.Cell>{batch.rawUrl}</Table.Cell>
                              <Table.Cell>{batch.memorySize}</Table.Cell>
                              <Table.Cell>
                                {formatDateTime(batch.ingestedAt)}
                              </Table.Cell>
                              {/* --- Generator: end */}
                              <Table.Cell>
                                {formatDateTime(batch.createdAt)}
                              </Table.Cell>
                              <Table.Cell textAlign="center">
                                <Confirm
                                  negative
                                  confirmText="Delete"
                                  header={`Are you sure you want to delete "${batch.id}"?`}
                                  content="All data will be permanently deleted"
                                  trigger={<Button basic icon="trash" />}
                                  onConfirm={async () => {
                                    await request({
                                      method: 'DELETE',
                                      path: `/1/batches/${batch.id}`,
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
