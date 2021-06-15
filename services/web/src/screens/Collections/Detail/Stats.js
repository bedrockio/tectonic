import React from 'react';
import { screen } from 'helpers';
import { AggregateStats } from 'react-tectonic';
import { numberWithCommas } from 'utils/formatting';
import { Divider, Statistic } from 'semantic-ui-react';
import Menu from './Menu';

@screen
export default class CollectionStats extends React.Component {
  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        <div>
          <Divider hidden />
          <AggregateStats index={collection.name} fields={['_id']} cardinality>
            {({ data }) => {
              return (
                <Statistic.Group widths="four">
                  <Statistic>
                    <Statistic.Value>{data['_id'] ? numberWithCommas(data['_id']) : '...'}</Statistic.Value>
                    <Statistic.Label>Total Events</Statistic.Label>
                  </Statistic>
                </Statistic.Group>
              );
            }}
          </AggregateStats>
        </div>
      </React.Fragment>
    );
  }
}
