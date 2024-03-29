import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import CodeBlock from 'components/CodeBlock';
import Heading from './Heading';
import 'github-markdown-css';
import { enrichMarkdown, executeOpenApiMacros } from 'utils/markdown';

import './table.less';

export default class StandardPage extends React.Component {
  render() {
    const { page, openApi } = this.props;
    let markdown = enrichMarkdown(page.markdown, localStorage.getItem('jwt'));
    markdown = executeOpenApiMacros(openApi, markdown);
    return (
      <div className="docs markdown-body">
        <ReactMarkdown
          allowDangerousHtml
          source={markdown}
          plugins={[gfm]}
          renderers={{
            code: CodeBlock,
            heading: Heading,
          }}
        />
      </div>
    );
  }
}
