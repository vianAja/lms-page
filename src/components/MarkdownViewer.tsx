'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '@/components/vn-ui';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="app-prose w-full pr-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-6 font-headline text-headline-lg text-[#4A4466]">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-10 border-b border-[#c8dfc9] pb-3 font-headline text-headline-md text-[#4A4466]">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-8 font-headline text-xl text-[#4A4466]">{children}</h3>,
          p: ({ children }) => <p className="mb-5 text-body-md leading-7 text-[#2a2840]">{children}</p>,
          li: ({ children }) => <li className="mb-2 text-body-md text-[#2a2840]">{children}</li>,
          code: ({ children }) => <code className="rounded-sm bg-[#6EADBC]/10 px-1.5 py-0.5 font-code text-code-md text-[#4A4466]">{children}</code>,
          pre: ({ children }) => (
            <div className="group relative my-6 overflow-hidden rounded-lg border border-[#c8dfc9] bg-[#1e1d2e]">
              <button
                type="button"
                aria-label="Copy code snippet"
                className="button-secondary absolute right-3 top-3 hidden min-h-9 px-3 text-xs group-hover:inline-flex bg-white/10 text-white hover:bg-white/20 border-transparent"
                onClick={(e) => {
                  const pre = (e.currentTarget.nextSibling as HTMLPreElement);
                  if (pre) {
                    navigator.clipboard.writeText(pre.textContent || '');
                  }
                }}
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
