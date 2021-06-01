import React from 'react';
import { Header, Table, Segment } from 'semantic-ui-react';
import { screen } from 'helpers';
import Menu from './Menu';
import ReactJson from 'react-json-view';

// --- Generator: overview-imports
import { formatDateTime } from 'utils/date';
// --- Generator: end

@screen
export default class AccessCredentialOverview extends React.Component {
  render() {
    const { accessCredential } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {/* --- Generator: overview-fields */}
        <Header as="h1">{accessCredential.name}</Header>
        <p>{accessCredential.description}</p>
        {/* --- Generator: end */}
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            {/* --- Generator: overview-rows */}
            {/* --- Generator: end */}
            <Table.Row>
              <Table.Cell>Created At</Table.Cell>
              <Table.Cell>{formatDateTime(accessCredential.createdAt)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Updated At</Table.Cell>
              <Table.Cell>{formatDateTime(accessCredential.updatedAt)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as="h1">JSON</Header>
        <Segment style={{ overflow: 'auto' }}>
          <ReactJson src={accessCredential} />
        </Segment>
      </React.Fragment>
    );
  }
}
