import React from 'react';
import { Header, Table, Segment } from 'semantic-ui-react';
import { screen } from 'helpers';
import Menu from './Menu';
import ReactJson from 'react-json-view';

import CodeBlockJson from 'components/CodeBlockJson';
import { formatDateTime } from 'utils/date';

@screen
export default class AccessCredentialOverview extends React.Component {
  render() {
    const { accessCredential } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
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
        <Header as="h3">JSON</Header>
        <CodeBlockJson value={accessCredential} />
      </React.Fragment>
    );
  }
}
