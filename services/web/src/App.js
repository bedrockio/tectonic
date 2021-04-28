import { hot } from 'react-hot-loader/root';
import 'theme/semantic.less';

import React from 'react';

import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthSwitch, Protected } from 'helpers/routes';

import Dashboard from 'screens/Dashboard';
import Docs from 'screens/Docs';
import Invites from 'screens/Invites';
import NotFound from 'screens/NotFound';
import Settings from 'screens/Settings';
import Datalakes from 'screens/Datalakes';
import Users from 'screens/Users';
import Policies from 'screens/Policies';

import AcceptInvite from 'screens/Auth/AcceptInvite';
import ForgotPassword from 'screens/Auth/ForgotPassword';
import ResetPassword from 'screens/Auth/ResetPassword';
import Login from 'screens/Auth/Login';
import Logout from 'screens/Auth/Logout';
import Signup from 'screens/Auth/Signup';

const App = () => (
  <Switch>
    <AuthSwitch path="/" loggedIn={Dashboard} loggedOut={Login} exact />
    <Protected path="/datalakes/:id?" allowed={Datalakes} />
    <Protected path="/policies/:id?" allowed={Policies} />
    <Protected path="/settings" allowed={Settings} exact />
    <Protected path="/invites" allowed={Invites} exact />
    <Protected path="/users/:id?" allowed={Users} />
    <Protected path="/docs/:id?" allowed={Docs} />
    <Route path="/logout" component={Logout} exact />
    <AuthSwitch
      path="/login"
      loggedOut={Login}
      loggedIn={() => <Redirect to="/" />}
      exact
    />
    <AuthSwitch
      path="/signup"
      loggedOut={Signup}
      loggedIn={() => <Redirect to="/" />}
      exact
    />
    <Route path="/accept-invite" component={AcceptInvite} exact />
    <Route path="/forgot-password" component={ForgotPassword} exact />
    <Route path="/reset-password" component={ResetPassword} exact />
    <Route component={NotFound} />
  </Switch>
);

export default hot(App);
