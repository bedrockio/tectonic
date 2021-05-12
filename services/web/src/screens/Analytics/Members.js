import React from 'react';
import { screen } from 'helpers';

import Terms from 'components/admin-analytics/Terms';
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
              <Header as="h4" content="Purchases by Member" textAlign="center" />
              <Terms index={'bar-purchases'} aggField="ccName" termsSize={10}>
                {(data) => {
                  return <DonutChart data={data} limit={7} percent />;
                }}
              </Terms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Member" textAlign="center" />
              <Divider hidden />
              <Terms index={'bar-purchases'} aggField="ccName" field="price" operation="sum" termsSize={10}>
                {(data) => {
                  return (
                    <Table data={data} valueField="value" valueFieldName="Revenue" valueFieldFormatter={formatUsd} />
                  );
                }}
              </Terms>
            </React.Fragment>
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
