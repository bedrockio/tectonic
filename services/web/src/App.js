import { hot } from 'react-hot-loader/root';

import React from 'react';

import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthSwitch, Protected } from 'helpers/routes';

import Dashboard from 'screens/Dashboard';
import Docs from 'screens/Docs';
import Components from 'screens/Components';
import NotFound from 'screens/NotFound';
import Settings from 'screens/Settings';
import Collections from 'screens/Collections';
import Users from 'screens/Users';
import AccessPolicies from 'screens/AccessPolicies';
import AccessCredentials from 'screens/AccessCredentials';
import ApplicationCredentials from 'screens/ApplicationCredentials';

import Login from 'screens/Auth/Login';
import Logout from 'screens/Auth/Logout';

const App = () => (
  <Switch>
    <AuthSwitch path="/" loggedIn={Dashboard} loggedOut={Login} exact />
    <Protected path="/collections/:id?" allowed={Collections} />
    <Protected path="/access/policies/:id?" allowed={AccessPolicies} />
    <Protected path="/access/credentials/:id?" allowed={AccessCredentials} />
    <Protected path="/applications/:id?" allowed={ApplicationCredentials} />
    <Protected path="/settings" allowed={Settings} exact />
    <Protected path="/users/:id?" allowed={Users} />
    <Route path="/docs/ui" component={Components} exact />
    <Route path="/docs/:id?" component={Docs} />
    <Route path="/logout" component={Logout} exact />
    <AuthSwitch path="/login" loggedOut={Login} loggedIn={() => <Redirect to="/" />} exact />
    <Route component={NotFound} />
  </Switch>
);

export default hot(App);
