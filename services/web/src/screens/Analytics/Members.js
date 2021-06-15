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
              <Header as="h4" content="Purchases by Member" textAlign="center" />
              <AggregateTerms collection={'bar-purchases'} aggField="ccName" termsSize={7}>
                <DonutChart limit={7} percent />
              </AggregateTerms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Member" textAlign="center" />
              <Divider hidden />
              <AggregateTerms
                collection={'bar-purchases'}
                aggField="ccName"
                field="price"
                operation="sum"
                termsSize={10}>
                <Table valueField="value" valueFieldName="Revenue" valueFieldFormatter={formatUsd} />
              </AggregateTerms>
            </React.Fragment>
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
