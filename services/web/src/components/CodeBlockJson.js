import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';

class CodeBlockJson extends PureComponent {
  static propTypes = {
    value: PropTypes.string.isRequired,
  };

  render() {
    const { value } = this.props;
    return (
      <ReactJson
        theme="tomorrow"
        src={value}
        style={{ padding: '1em', borderRadius: '0.3em' }}
        displayDataTypes={false}
        displayObjectSize={false}
        quotesOnKeys={false}
        displayArrayKey={false}
      />
    );
  }
}

export default CodeBlockJson;
