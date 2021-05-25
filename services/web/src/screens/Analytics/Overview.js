import React from 'react';
import { screen } from 'helpers';

import { AggregateTimeSeries, AggregateStats, SeriesChart } from 'react-tectonic';

import Block from 'components/Block';

import { numberWithCommas, formatUsd } from 'utils/formatting';

import { Divider, Header, Statistic } from 'semantic-ui-react';

import Menu from './Menu';

@screen
export default class AnalyticsOverview extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Menu {...this.props} />

        <Divider hidden />
        <Statistic.Group widths="four">
          <AggregateStats index="bar-purchases" fields={['event.id']} cardinality>
            {({ data }) => (
              <Statistic>
                <Statistic.Value>{data['event.id'] ? numberWithCommas(data['event.id']) : '...'}</Statistic.Value>
                <Statistic.Label>Total Purchases</Statistic.Label>
              </Statistic>
            )}
          </AggregateStats>
          <AggregateStats index="bar-purchases" fields={['event.consumption.price']}>
            {({ data }) => (
              <Statistic>
                <Statistic.Value>
                  {data['event.consumption.price'] ? formatUsd(data['event.consumption.price'].sum) : '...'}
                </Statistic.Value>
                <Statistic.Label>Revenue</Statistic.Label>
              </Statistic>
            )}
          </AggregateStats>
        </Statistic.Group>

        <Divider hidden />
        <Divider hidden />

        <Block>
          <Header as="h4" content="Purchases over Time" textAlign="center" />
          <AggregateTimeSeries index="bar-purchases" operation="count" interval="1d" dateField="event.orderedAt">
            <SeriesChart height={250} bar valueField="count" />
          </AggregateTimeSeries>
        </Block>

        <Block>
          <Header as="h4" content="Revenue over Time" textAlign="center" />
          <AggregateTimeSeries
            index="bar-purchases"
            operation="sum"
            field="event.consumption.price"
            interval="1w"
            dateField="event.orderedAt">
            <SeriesChart height={250} bar valueField="value" valueFieldFormatter={formatUsd} />
          </AggregateTimeSeries>
        </Block>
      </React.Fragment>
    );
  }
}
