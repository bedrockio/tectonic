import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import { screen } from 'helpers';
import Menu from './Menu';
import CodeBlockJson from 'components/CodeBlockJson';

import { formatDateTime } from 'utils/date';

@screen
export default class ApplicationCredentialOverview extends React.Component {
  render() {
    const { applicationCredential } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Created At</Table.Cell>
              <Table.Cell>{formatDateTime(applicationCredential.createdAt)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Updated At</Table.Cell>
              <Table.Cell>{formatDateTime(applicationCredential.updatedAt)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as="h3">JSON</Header>
        <CodeBlockJson value={applicationCredential} />
      </React.Fragment>
    );
  }
}
