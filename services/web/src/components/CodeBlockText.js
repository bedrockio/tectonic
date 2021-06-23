import React from 'react';

export default ({ text }) => {
  return (
    <React.Fragment>
      <div
        style={{
          color: 'rgb(197, 200, 198)',
          backgroundColor: 'rgb(29, 31, 33)',
          margin: '0.5em 0px 1em',
          padding: '1em',
          borderRadius: '0.3em',
          lineHeight: '1.5',
          fontFamily: 'Inconsolata, Monaco, Consolas, "Courier New", Courier, monospace',
        }}>
        <code
          style={{
            wordBreak: 'break-all',
          }}>
          {text}
        </code>
      </div>
    </React.Fragment>
  );
};
