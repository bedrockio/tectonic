import React from 'react';
import { Modal } from 'semantic';
import { modal } from 'helpers';

import CodeBlockJson from 'components/CodeBlockJson';

@modal
export default class InspectObject extends React.Component {
  render() {
    const { object } = this.props;
    return (
      <>
        <Modal.Header>Inspect Object</Modal.Header>
        <Modal.Content>
          <CodeBlockJson value={object} />
        </Modal.Content>
      </>
    );
  }
}
