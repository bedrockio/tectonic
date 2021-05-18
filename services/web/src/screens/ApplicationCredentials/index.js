import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './List';
import Detail from './Detail';

export default class ApplicationCredentials extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/application-credentials" component={List} exact />
        <Route path="/application-credentials/:id" component={Detail} />
      </Switch>
    );
  }
}
