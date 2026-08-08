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
          h1: ({ children }) => <h1 className="mb-6 font-headline text-2xl font-bold text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-8 border-b border-gray-200 pb-2 font-headline text-xl font-bold text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-6 font-headline text-lg font-semibold text-gray-900">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-sm leading-relaxed text-gray-700">{children}</p>,
          li: ({ children }) => <li className="mb-1.5 text-sm text-gray-700">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-emerald-600 bg-emerald-50/60 px-4 py-3 text-sm text-gray-700 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }: any) => {
            return (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-code text-[13px] text-gray-800 border border-gray-200" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="group relative my-5 overflow-hidden rounded-xl border border-gray-800 bg-[#1E293B] shadow-sm">
              <button
                type="button"
                aria-label="Copy code snippet"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-slate-700/80 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-600 hover:text-white transition-all z-10"
                onClick={(e) => {
                  const container = e.currentTarget.parentElement;
                  const codeEl = container?.querySelector('pre');
                  if (codeEl) {
                    navigator.clipboard.writeText(codeEl.textContent || '');
                  }
                }}
              >
                <Icon name="content_copy" className="text-[15px]" />
              </button>
              <pre className="overflow-x-auto p-4 font-code text-[13px] text-slate-100 bg-[#1E293B] [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-slate-100">{children}</pre>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
