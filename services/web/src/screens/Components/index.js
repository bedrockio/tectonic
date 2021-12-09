import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Card,
  Container,
  Divider,
  Dropdown,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Label,
  Menu,
  Message,
  Progress,
  Ref,
  Segment,
  Statistic,
  Table,
  TextArea,
} from 'semantic';
import { screen } from 'helpers';
import { Layout } from 'components/Layout';
import Breadcrumbs from 'components/Breadcrumbs';
import { Menu as ResponsiveMenu } from 'components/Responsive';
import { JumpLink } from 'components/Link';
import CodeBlock from 'components/CodeBlock';
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
                    valueField="name"
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
