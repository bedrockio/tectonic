import { hot } from 'react-hot-loader/root';
import 'theme/semantic.less';

import React from 'react';

import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthSwitch, Protected } from 'helpers/routes';

import Dashboard from 'screens/Dashboard';
import Docs from 'screens/Docs';
import NotFound from 'screens/NotFound';
import Settings from 'screens/Settings';
import Collections from 'screens/Collections';
import Users from 'screens/Users';
import AccessPolicies from 'screens/AccessPolicies';
import Analytics from 'screens/Analytics';

import Login from 'screens/Auth/Login';
import Logout from 'screens/Auth/Logout';

const App = () => (
  <Switch>
    <AuthSwitch path="/" loggedIn={Dashboard} loggedOut={Login} exact />
    <Protected path="/collections/:id?" allowed={Collections} />
    <Protected path="/access-policies/:id?" allowed={AccessPolicies} />
    <Protected path="/analytics/:id?" allowed={Analytics} />
    <Protected path="/settings" allowed={Settings} exact />
    <Protected path="/users/:id?" allowed={Users} />
    <Protected path="/docs/:id?" allowed={Docs} />
    <Route path="/logout" component={Logout} exact />
    <AuthSwitch path="/login" loggedOut={Login} loggedIn={() => <Redirect to="/" />} exact />
    <Route component={NotFound} />
  </Switch>
);

export default hot(App);
