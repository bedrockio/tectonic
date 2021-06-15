// react-hot-loader needs to be imported
// before react and react-dom
import 'react-hot-loader';
import { TectonicProvider } from 'react-tectonic';

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SessionProvider } from 'stores';
import App from './App';
import 'utils/sentry';

const Wrapper = () => (
  <BrowserRouter>
    <SessionProvider>
      <HelmetProvider>
        <TectonicProvider token={localStorage.getItem('jwt')}>
          <App />
        </TectonicProvider>
      </HelmetProvider>
    </SessionProvider>
  </BrowserRouter>
);

ReactDOM.render(<Wrapper />, document.getElementById('root'));
