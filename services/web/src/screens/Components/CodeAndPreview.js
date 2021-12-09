import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Segment } from 'semantic';
import CodeBlock from 'components/CodeBlock';
import { API_URL } from 'utils/env';
import { TectonicProvider, AggregateTimeSeries, SeriesChart } from 'react-tectonic';

export default class Components extends React.Component {
  state = {};
  render() {
    const { collection } = this.state;
    return (
      <div style={{ width: '100%' }}>
        <Segment style={{ height: `${window.innerHeight * 0.45}px` }}>
          {collection && (
            <TectonicProvider
              debug
              baseUrl={API_URL}
              token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVkZW50aWFsSWQiOiI2MWIwMDBlNWI3Y2JjZDAwNWNiOWU3NTgiLCJ0eXBlIjoiYXBwbGljYXRpb24iLCJpYXQiOjE2MzkwMjEwNjl9.4qXDh6082xyJsr0Wm-szPx31ai8CLTEpC7pgJnCHrjE"
              collection={collection.name}
              dateField="orderedAt"
              timeRangeMode="all">
              <AggregateTimeSeries collection={collection.name} operation="count">
                <SeriesChart
                  title={collection.name}
                  titleAlign="center"
                  chartType="bar"
                  height={250}
                  valueField="count"
                />
              </AggregateTimeSeries>
            </TectonicProvider>
          )}
        </Segment>
        <CodeBlock
          customStyle={{ height: `${window.innerHeight * 0.45}px` }}
          language="javascript"
          value={JSON.stringify(this.props, null, 2)}
        />
      </div>
    );
  }
}
