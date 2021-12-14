import React from 'react';
import { Form, Grid } from 'semantic';
import { screen } from 'helpers';
import { request } from 'utils/api';
import SearchDropdown from 'components/SearchDropdown';
import CodeAndPreview from './CodeAndPreview';

@screen
export default class Components extends React.Component {
  state = {};
  render() {
    return (
      <div>
        <Grid>
          <Grid.Row divided>
            <Grid.Column width={4}>
              <Form>
                <Form.Field>
                  <label>Collection</label>
                  <SearchDropdown
                    value={this.state.collection}
                    name="collection"
                    onChange={(e, { value }) => {
                      this.setState({
                        collection: value,
                      });
                    }}
                    onDataNeeded={() =>
                      request({
                        method: 'POST',
                        path: `/1/collections/search`,
                      }).then(({ data }) => data)
                    }
                  />
                </Form.Field>
              </Form>
            </Grid.Column>
            <Grid.Column width={12}>
              <CodeAndPreview {...this.state} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}
