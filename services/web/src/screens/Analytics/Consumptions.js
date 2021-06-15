import React from 'react';
import { screen } from 'helpers';
import { AggregateTerms, DonutChart, Table, Aggregate, MultiSeriesChart } from 'react-tectonic';
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
              <AggregateTerms collection={'bar-purchases'} aggField="event.consumption.category" termsSize={10}>
                <DonutChart limit={5} percent />
              </AggregateTerms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Category" textAlign="center" />
              <Divider hidden />

              <AggregateTerms
                collection={'bar-purchases'}
                aggField="event.consumption.category"
                field="event.consumption.price"
                operation="sum"
                termsSize={10}>
                <Table valueField="value" valueFieldName="Revenue" valueFieldFormatter={formatUsd} />
              </AggregateTerms>
            </React.Fragment>
          </Block>

          <Block>
            <Header as="h4" content="Revenue by Category" textAlign="center" />

            <AggregateTerms
              collection={'bar-purchases'}
              aggField="event.consumption.category"
              field="event.consumption.price"
              operation="sum"
              termsSize={10}>
              {({ data: terms }) => {
                return (
                  <Aggregate
                    type="time-series"
                    requests={terms.map((term) => {
                      return {
                        collection: 'bar-purchases',
                        operation: 'sum',
                        field: 'event.consumption.price',
                        interval: '1w',
                        dateField: 'event.orderedAt',
                        filter: {
                          terms: [{ 'event.consumption.category': { value: term.key } }],
                        },
                      };
                    })}>
                    <MultiSeriesChart
                      height={250}
                      variant="area"
                      area
                      stacked
                      valueField="value"
                      valueFieldFormatter={formatUsd}
                      valueFieldNames={terms.map((term) => term.key)}
                    />
                  </Aggregate>
                );
              }}
            </AggregateTerms>
          </Block>

          <Block columns={2}>
            <React.Fragment>
              <Header as="h4" content="Purchases by Consumption" textAlign="center" />
              <AggregateTerms collection={'bar-purchases'} aggField="event.consumption.name" termsSize={10}>
                <DonutChart limit={8} percent />
              </AggregateTerms>
            </React.Fragment>
            <React.Fragment>
              <Header as="h4" content="Revenue by Consumption" textAlign="center" />
              <Divider hidden />
              <AggregateTerms
                collection={'bar-purchases'}
                aggField="event.consumption.name"
                field="event.consumption.price"
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
