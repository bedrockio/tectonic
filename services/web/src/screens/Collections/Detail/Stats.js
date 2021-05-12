import React from 'react';
import { screen } from 'helpers';
import MultiStats from 'components/admin-analytics/MultiStats';

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
          <MultiStats
            fetches={[
              {
                index: collection.name,
                fields: ['_id'],
                cardinality: true,
              },
            ]}>
            {(data) => {
              return (
                <Statistic.Group widths="four">
                  <Statistic>
                    <Statistic.Value>{numberWithCommas(data[0]['_id'])}</Statistic.Value>
                    <Statistic.Label>Total Events</Statistic.Label>
                  </Statistic>
                </Statistic.Group>
              );
            }}
          </MultiStats>
        </div>
      </React.Fragment>
    );
  }
}
