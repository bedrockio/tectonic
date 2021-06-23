import React from 'react';
import { Popup, Button } from 'semantic';

export default class CopyToClipboardButton extends React.Component {
  state = {
    loading: false,
    showTip: false,
  };

  onClick = async () => {
    this.setState({
      loading: true,
    });
    await this.props.onClick();
    if (this.mounted) {
      this.setState({
        loading: false,
      });
    }
  };

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  copy(text) {
    navigator.clipboard.writeText(text);
  }

  handleOpen = () => {
    this.setState({ showTip: true });

    this.timeout = setTimeout(() => {
      this.setState({ showTip: false });
    }, 2000);
  };

  handleClose = () => {
    this.setState({ showTip: false });
    clearTimeout(this.timeout);
  };

  render() {
    const { showTip } = this.state;
    const { text, ...props } = this.props;
    return (
      <Popup
        trigger={
          <Button
            icon={showTip ? 'check' : 'clipboard'}
            content="Copy to Clipboard"
            {...props}
            style={{ margin: 0 }}
            onClick={() => this.copy(text)}
          />
        }
        content="Copied to clipboard!"
        on="click"
        open={showTip}
        onClose={this.handleClose}
        onOpen={this.handleOpen}
        position="top center"
      />
    );
  }
}
