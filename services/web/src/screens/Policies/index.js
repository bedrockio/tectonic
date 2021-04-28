import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class Policies extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/policies" component={List} exact />
        <Route path="/policies/:id" component={Detail} />
      </Switch>
    );
  }
}
