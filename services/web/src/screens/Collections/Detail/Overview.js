import React from 'react';
import { Header, Table } from 'semantic';
import { screen } from 'helpers';
import Menu from './Menu';

import { formatDateTime } from 'utils/date';
import CodeBlockJson from 'components/CodeBlockJson';

@screen
export default class CollectionOverview extends React.Component {
  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <p>{collection.description}</p>
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            <Table.Row>
              <Table.Cell>ID</Table.Cell>
              <Table.Cell>{collection.id}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Created At</Table.Cell>
              <Table.Cell>{formatDateTime(collection.createdAt)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Updated At</Table.Cell>
              <Table.Cell>{formatDateTime(collection.updatedAt)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as="h1">Mapping</Header>
        <CodeBlockJson value={collection.mapping} />
      </React.Fragment>
    );
  }
}
