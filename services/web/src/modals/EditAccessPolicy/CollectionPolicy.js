import React from 'react';
import { Form, Segment, Button, Header, Divider, Message } from 'semantic-ui-react';
import { request } from 'utils/api';
import SearchDropdown from 'components/SearchDropdown';

// --- Generator: imports
// --- Generator: end

export default class EditAccessPolicy extends React.Component {
  state = {
    collection: '',
    scope: {},
  };

  handleRemove = (collection) => {
    this.props.onChange(this.props.collections.filter((c) => c !== collection));
  };

  handleAdd = () => {
    const { collection, scope } = this.state;

    this.props.onChange([
      ...this.props.collections,
      {
        collection,
        scope,
      },
    ]);
  };

  render() {
    const { collection, scope } = this.state;
    const { collections = [] } = this.props;
    return (
      <Segment>
        <Header>Policies</Header>
        {collections.length === 0 && <Message>No Policies yet.</Message>}
        {collections.map((collection) => (
          <div
            style={{
              marginBottom: '0.5em',
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
            key={collection.collection}>
            <Form.Field>
              <label>Collection</label> {collection.collection}
            </Form.Field>
            <Form.Field disabled>
              <label>Scope</label>
            </Form.Field>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button basic icon="close" onClick={() => this.handleRemove(collection)} />
            </div>
          </div>
        ))}
        <Divider />
        <Header>Add</Header>
        <Form.Group>
          <Form.Field required>
            <label>Collection</label>
            <SearchDropdown
              valueField="name"
              value={collection}
              name="collection"
              onChange={(e, { value }) => {
                this.setState({
                  collection: value,
                });
              }}
              fetchData={() =>
                request({
                  method: 'POST',
                  path: `/1/collections/search`,
                })
              }
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              required
              type="text"
              value={JSON.stringify(scope)}
              disabled
              name="scope"
              label="Scope"
              onChange={(e, { value }) => {
                this.setState({
                  scope: value,
                });
              }}
            />
          </Form.Field>
        </Form.Group>
        <Button disabled={!collection.length} onClick={() => this.handleAdd()}>
          Add Policy
        </Button>
      </Segment>
    );
  }
}
