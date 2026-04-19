'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-invert prose-zinc max-w-none w-full h-full overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-6">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-semibold text-zinc-100 mt-10 mb-4 border-b border-zinc-800 pb-2">{children}</h2>,
          code: ({ children }) => <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">{children}</code>,
          pre: ({ children }) => <pre className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl overflow-x-auto my-6">{children}</pre>,
          p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-6">{children}</p>,
          li: ({ children }) => <li className="text-zinc-300 mb-2">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
