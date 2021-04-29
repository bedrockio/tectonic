import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class Collections extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/collections" component={List} exact />
        <Route path="/collections/:id" component={Detail} />
      </Switch>
    );
  }
}
