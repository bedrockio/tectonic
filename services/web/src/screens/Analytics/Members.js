import React from 'react';
import { screen } from 'helpers';

import Terms from 'components/analytics/Terms';
import TimeSeries from 'components/analytics/TimeSeries';
import MultiTimeSeries from 'components/analytics/MultiTimeSeries';
import MultiStats from 'components/analytics/MultiStats';

import SeriesChart from 'components/visualizations/SeriesChart';
import MultiSeriesChart from 'components/visualizations/MultiSeriesChart';
import DonutChart from 'components/visualizations/DonutChart';
import Table from 'components/visualizations/Table';

import { numberWithCommas, formatUsd } from 'utils/formatting';

import { Divider, Segment, Header, Statistic, Message, Button } from 'semantic-ui-react';

import Block from 'components/Block';
import { startCase } from 'lodash';
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
              <Terms index={'purchases'} aggField="ccName" termsSize={10}>
                {(data) => {
                  return <DonutChart data={data} limit={7} percent />;
                }}
              </Terms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Member" textAlign="center" />
              <Divider hidden />
              <Terms index={'purchases'} aggField="ccName" field="price" operation="sum" termsSize={10}>
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
