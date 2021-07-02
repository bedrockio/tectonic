import React from 'react';
import { Table, Message, Loader, Button, Header } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Layout, Confirm, HelpTip, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import InspectObject from 'modals/InspectObject';
import InspectBatchEvents from 'modals/InspectBatchEvents';

import Menu from './Menu';

@screen
export default class CollectionBatches extends React.Component {
  onDataNeeded = async (params) => {
    const { collection } = this.props;
    return await request({
      method: 'POST',
      path: '/1/batches/search',
      body: {
        ...params,
        collection: collection.id,
      },
    });
  };

  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {collection ? (
          <SearchProvider sort={{ order: 'desc', field: 'ingestedAt' }} onDataNeeded={this.onDataNeeded}>
            {({ items: batches, filters, setFilters, getSorted, setSort, reload }) => {
              return (
                <React.Fragment>
                  <Header as="h2">
                    <Layout horizontal center spread>
                      Batches
                      <Layout.Group>
                        <Filters size="tiny" onSave={setFilters} filters={filters}>
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
                          <Table.HeaderCell sorted={getSorted('id')} onClick={() => setSort('id')}>
                            BatchId
                          </Table.HeaderCell>
                          <Table.HeaderCell width={1}>Events</Table.HeaderCell>
                          <Table.HeaderCell width={2}>Size</Table.HeaderCell>
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('ingestedAt')}
                            onClick={() => setSort('ingestedAt')}>
                            Ingested
                            <HelpTip title="IngestedAt" text="This is the date and time the batch was ingested." />
                          </Table.HeaderCell>
                          {/* --- Generator: end */}
                          <Table.HeaderCell textAlign="center" width={3}>
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
                              <Table.Cell>{batch.memorySize}</Table.Cell>
                              <Table.Cell>{formatDateTime(batch.ingestedAt)}</Table.Cell>
                              {/* --- Generator: end */}
                              <Table.Cell textAlign="center">
                                <InspectObject object={batch} trigger={<Button basic icon="file-code" />} />
                                <InspectBatchEvents batch={batch} trigger={<Button basic icon="search" />} />
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
