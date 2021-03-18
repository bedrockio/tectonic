import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class Datalakes extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/datalakes" component={List} exact />
        <Route path="/datalakes/:id" component={Detail} />
      </Switch>
    );
  }
}
