import React from 'react';
import { Header, Table } from 'semantic';
import { screen } from 'helpers';
import Menu from './Menu';

import CodeBlockJson from 'components/CodeBlockJson';
import { formatDateTime } from 'utils/date';

@screen
export default class AccessPolicyOverview extends React.Component {
  render() {
    const { policy } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Created At</Table.Cell>
              <Table.Cell>{formatDateTime(policy.createdAt)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Updated At</Table.Cell>
              <Table.Cell>{formatDateTime(policy.updatedAt)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as="h3">JSON</Header>
        <CodeBlockJson value={policy} />
      </React.Fragment>
    );
  }
}
