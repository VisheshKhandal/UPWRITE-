import { memo, type HTMLAttributes } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { readerHeadings } from './readerModel';
const headings: Components = {
  h1: ({ children, node: _node, ...props }) => <h2 {...props} tabIndex={-1}>{children}</h2>,
  h2: ({ children, node: _node, ...props }) => <h2 {...props} tabIndex={-1}>{children}</h2>,
  h3: ({ children, node: _node, ...props }) => <h3 {...props} tabIndex={-1}>{children}</h3>,
  h4: ({ children, node: _node, ...props }) => <h4 {...props} tabIndex={-1}>{children}</h4>,
  h5: ({ children, node: _node, ...props }) => <h5 {...props} tabIndex={-1}>{children}</h5>,
  h6: ({ children, node: _node, ...props }) => <h6 {...props} tabIndex={-1}>{children}</h6>
};
/** Stable component identities preserve selections and DOM ranges during progress updates. */
export const ReaderMarkdown = memo(({ content }: { content: string } & HTMLAttributes<HTMLDivElement>) => <ReactMarkdown remarkPlugins={[remarkGfm, readerHeadings]} rehypePlugins={[rehypeHighlight]} components={headings}>{content}</ReactMarkdown>);
