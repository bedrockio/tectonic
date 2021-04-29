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
          <Divider hidden />
          <MultiStats
            fetches={[
              {
                index: 'purchases',
                fields: ['event.id'],
                cardinality: true,
              },
              {
                index: 'purchases',
                fields: ['event.consumption.price'],
              },
            ]}>
            {(data) => {
              return (
                <Statistic.Group widths="four">
                  <Statistic>
                    <Statistic.Value>{numberWithCommas(data[0]['event.id'])}</Statistic.Value>
                    <Statistic.Label>Total Purchases</Statistic.Label>
                  </Statistic>
                  <Statistic>
                    <Statistic.Value>{formatUsd(data[1]['event.consumption.price'].sum)}</Statistic.Value>
                    <Statistic.Label>Revenue</Statistic.Label>
                  </Statistic>
                </Statistic.Group>
              );
            }}
          </MultiStats>

          <Divider hidden />
          <Divider hidden />

          <Block>
            <Header as="h4" content="Purchases over Time" textAlign="center" />
            <TimeSeries index="purchases" operation="count" interval="1d" dateField="event.orderedAt">
              {(data) => {
                return <SeriesChart data={data} height={250} bar valueField="count" />;
              }}
            </TimeSeries>
          </Block>

          <Block>
            <Header as="h4" content="Revenue over Time" textAlign="center" />
            <TimeSeries
              index="purchases"
              operation="sum"
              field="event.consumption.price"
              interval="1w"
              dateField="event.orderedAt">
              {(data) => {
                return <SeriesChart data={data} height={250} bar valueField="value" valueFieldFormatter={formatUsd} />;
              }}
            </TimeSeries>
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
