import React from 'react';
import { screen } from 'helpers';

import Terms from 'components/analytics/Terms';
import DonutChart from 'components/visualizations/DonutChart';
import Table from 'components/visualizations/Table';
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
              <Terms
                index={'bar-purchases'}
                aggField="event.server.name"
                field="event.consumption.price"
                operation="sum"
                termsSize={10}>
                {(data) => {
                  return (
                    <Table data={data} valueField="value" valueFieldName="Revenue" valueFieldFormatter={formatUsd} />
                  );
                }}
              </Terms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Purchases by Staff" textAlign="center" />
              <Terms index={'bar-purchases'} aggField="event.server.name" termsSize={10}>
                {(data) => {
                  return <DonutChart data={data} limit={5} percent />;
                }}
              </Terms>
            </React.Fragment>
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
