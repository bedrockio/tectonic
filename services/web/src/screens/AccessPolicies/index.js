import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class Policies extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/access-policies" component={List} exact />
        <Route path="/access-policies/:id" component={Detail} />
      </Switch>
    );
  }
}
