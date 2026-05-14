'use client';

import ReactMarkdown from 'react-markdown';
import { Icon } from '@/components/vn-ui';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="app-prose h-full w-full overflow-y-auto pr-4">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-6 font-headline text-headline-lg text-on-surface">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-10 border-b border-outline-variant pb-3 font-headline text-headline-md text-primary">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-8 font-headline text-xl text-on-surface">{children}</h3>,
          p: ({ children }) => <p className="mb-5 text-body-md leading-7 text-on-surface-variant">{children}</p>,
          li: ({ children }) => <li className="mb-2 text-body-md text-on-surface-variant">{children}</li>,
          code: ({ children }) => <code className="rounded-sm bg-primary-container/10 px-1.5 py-0.5 font-code text-code-md text-primary">{children}</code>,
          pre: ({ children }) => (
            <div className="group relative my-6 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high">
              <button
                type="button"
                aria-label="Copy code snippet"
                className="button-secondary absolute right-3 top-3 hidden min-h-9 px-3 text-xs group-hover:inline-flex"
              >
                <Icon name="content_copy" className="text-[18px]" />
                Copy
              </button>
              <pre className="overflow-x-auto p-5">{children}</pre>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
