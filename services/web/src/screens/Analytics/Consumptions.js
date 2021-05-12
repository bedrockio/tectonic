import React from 'react';
import { screen } from 'helpers';

import Terms from 'components/admin-analytics/Terms';
import MultiTimeSeries from 'components/admin-analytics/MultiTimeSeries';
import MultiSeriesChart from 'components/visualizations/MultiSeriesChart';
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
              <Header as="h4" content="Purchases by Category" textAlign="center" />
              <Terms index={'bar-purchases'} aggField="event.consumption.category" termsSize={10}>
                {(data) => {
                  return <DonutChart data={data} limit={5} percent />;
                }}
              </Terms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Category" textAlign="center" />
              <Divider hidden />
              <Terms
                index={'bar-purchases'}
                aggField="event.consumption.category"
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
          </Block>

          <Block>
            <Header as="h4" content="Revenue by Category" textAlign="center" />

            <Terms
              index={'bar-purchases'}
              aggField="event.consumption.category"
              field="event.consumption.price"
              operation="sum"
              termsSize={10}>
              {(terms) => {
                return (
                  <MultiTimeSeries
                    fetches={terms.map((term) => {
                      return {
                        index: 'bar-purchases',
                        operation: 'sum',
                        field: 'event.consumption.price',
                        interval: '1w',
                        dateField: 'event.orderedAt',
                        filter: {
                          terms: [{ 'event.consumption.category': { value: term.key } }],
                        },
                      };
                    })}>
                    {(data) => {
                      return (
                        <MultiSeriesChart
                          data={data}
                          height={250}
                          area
                          stacked
                          valueField="value"
                          valueFieldFormatter={formatUsd}
                          valueFieldNames={terms.map((term) => term.key)}
                        />
                      );
                    }}
                  </MultiTimeSeries>
                );
              }}
            </Terms>
          </Block>

          <Block columns={2}>
            <React.Fragment>
              <Header as="h4" content="Purchases by Consumption" textAlign="center" />
              <Terms index={'bar-purchases'} aggField="event.consumption.name" termsSize={10}>
                {(data) => {
                  return <DonutChart data={data} limit={8} percent />;
                }}
              </Terms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Consumption" textAlign="center" />
              <Divider hidden />
              <Terms
                index={'bar-purchases'}
                aggField="event.consumption.name"
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
          </Block>
        </div>
      </React.Fragment>
    );
  }
}
