import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class ApplicationCredentials extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/applications" component={List} exact />
        <Route path="/applications/:id" component={Detail} />
      </Switch>
    );
  }
}
