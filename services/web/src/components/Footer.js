import React from 'react';
import { withSession } from 'stores';

@withSession
export default class Footer extends React.Component {
  render() {
    const { user } = this.context;
    if (!user) {
      return null;
    }
    return <footer></footer>;
  }
}
