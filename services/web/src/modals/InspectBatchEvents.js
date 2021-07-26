import React from 'react';
import { Progress, Modal, Message } from 'semantic';
import { request } from 'utils/api';
import { modal } from 'helpers';
import CodeBlockJson from 'components/CodeBlockJson';

@modal
export default class InspectBatchEvents extends React.Component {
  state = {
    error: null,
    loading: false,
    events: null,
  };

  componentDidMount() {
    this.fetchEvents();
  }

  async fetchEvents() {
    const { batch } = this.props;
    this.setState({
      error: null,
      loading: true,
    });
    try {
      const { data } = await request({
        method: 'POST',
        path: `/1/analytics/search`,
        body: {
          collection: batch.collectionId,
          filter: {
            terms: [{ batchId: batch.id }],
          },
        },
      });
      const events = data.map((item) => {
        return item._source;
      });
      this.setState({
        events,
        error: null,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error,
        loading: false,
      });
    }
  }

  render() {
    const { batch } = this.props;
    const { loading, error, events } = this.state;
    return (
      <>
        <Modal.Header>{batch.id} Events</Modal.Header>
        <Modal.Content scrolling>
          {loading && <Progress active progress percent={100} />}
          {error && <Message error content={error.message} />}
          {events && <CodeBlockJson value={events} />}
        </Modal.Content>
        <Modal.Actions></Modal.Actions>
      </>
    );
  }
}
