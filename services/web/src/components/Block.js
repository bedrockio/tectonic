import React from 'react';
import { Divider, Segment, Header, Statistic, Table, Message, Button, Grid } from 'semantic-ui-react';

export default ({ columns, children }) => {
  return (
    <React.Fragment>
      <Segment basic>
        <Divider hidden />
        {columns > 0 ? (
          <Grid columns={columns}>
            <Grid.Row>
              {children.map((child) => {
                return <Grid.Column>{child}</Grid.Column>;
              })}
            </Grid.Row>
          </Grid>
        ) : (
          children
        )}
        <Divider hidden />
      </Segment>
      <Divider hidden />
    </React.Fragment>
  );
};
