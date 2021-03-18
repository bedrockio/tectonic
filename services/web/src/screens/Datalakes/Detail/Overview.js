import React from 'react';
import { Header, Table, Image, Label } from 'semantic-ui-react';
import { screen } from 'helpers';
import Menu from './Menu';

// --- Generator: overview-imports
import { formatDateTime } from 'utils/date';
import { urlForUpload } from 'utils/uploads';
// --- Generator: end

@screen
export default class DatalakeOverview extends React.Component {
  render() {
    const { datalake } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {/* --- Generator: overview-fields */}
        <Header as="h1">{datalake.name}</Header>
        <p>{datalake.description}</p>
        <Header as="h3">Images</Header>
        <Image.Group size="large">
          {datalake.images.map((image) => (
            <Image key={image.id} src={urlForUpload(image)} />
          ))}
        </Image.Group>
        {/* --- Generator: end */}
        <Header as="h3">Details</Header>
        <Table definition>
          <Table.Body>
            {/* --- Generator: overview-rows */}
            <Table.Row>
              <Table.Cell>Categories</Table.Cell>
              <Table.Cell>
                {datalake.categories.map((category) => (
                  <Label key={category.id} content={category.name} />
                ))}
              </Table.Cell>
            </Table.Row>
            {/* --- Generator: end */}
            <Table.Row>
              <Table.Cell>Created At</Table.Cell>
              <Table.Cell>{formatDateTime(datalake.createdAt)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Updated At</Table.Cell>
              <Table.Cell>{formatDateTime(datalake.updatedAt)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </React.Fragment>
    );
  }
}
