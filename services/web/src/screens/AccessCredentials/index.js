import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class AccessCredentials extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/access/credentials" component={List} exact />
        <Route path="/access/credentials/:id" component={Detail} />
      </Switch>
    );
  }
}
