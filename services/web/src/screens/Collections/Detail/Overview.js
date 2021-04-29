import React from 'react';
import { Header, Table, Label, Segment } from 'semantic-ui-react';
import { screen } from 'helpers';
import Menu from './Menu';
import ReactJson from 'react-json-view';

// --- Generator: overview-imports
import { formatDateTime } from 'utils/date';
// --- Generator: end

@screen
export default class CollectionOverview extends React.Component {
  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {/* --- Generator: overview-fields */}
        <Header as="h1">{collection.name}</Header>
        <p>{collection.description}</p>
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Categories</Table.Cell>
              <Table.Cell>
                {collection.categories.map((category) => (
                  <Label key={category.id} content={category.name} />
                ))}
              </Table.Cell>
            </Table.Row>
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
        <Segment style={{ overflow: 'auto' }}>
          <ReactJson src={collection.mapping} />
        </Segment>
      </React.Fragment>
    );
  }
}
