import React from 'react';
import { screen } from 'helpers';
import { AggregateTerms, DonutChart, Table } from 'react-tectonic';
import Block from 'components/Block';
import { formatUsd } from 'utils/formatting';
import { Divider, Header } from 'semantic-ui-react';
import Menu from './Menu';

@screen
export default class AnalyticsOverview extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <div>
          <Block columns={2}>
            <React.Fragment>
              <Header as="h4" content="Revenue by Staff" textAlign="center" />
              <Divider hidden />
              <AggregateTerms
                index={'bar-purchases'}
                aggField="event.server.name"
                field="event.consumption.price"
                operation="sum"
                termsSize={10}>
                <Table valueField="value" valueFieldName="Revenue" valueFieldFormatter={formatUsd} />
              </AggregateTerms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Purchases by Staff" textAlign="center" />
              <AggregateTerms index={'bar-purchases'} aggField="event.server.name" termsSize={10}>
                <DonutChart limit={5} percent />
              </AggregateTerms>
            </React.Fragment>
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
