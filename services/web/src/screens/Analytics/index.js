import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Overview from './Overview';
import Consumptions from './Consumptions';
import Staff from './Staff';
import Members from './Members';

export default class Analytics extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/analytics" render={(props) => <Overview {...props} />} />
        <Route exact path="/analytics/consumptions" render={(props) => <Consumptions {...props} />} />
        <Route exact path="/analytics/staff" render={(props) => <Staff {...props} />} />
        <Route exact path="/analytics/members" render={(props) => <Members {...props} />} />
      </Switch>
    );
  }
}
