"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content min-w-0 max-w-full prose prose-invert prose-sm prose-headings:text-text-primary prose-h2:text-lg prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-0 prose-h2:mb-4 prose-h3:text-sm prose-h3:font-semibold prose-h3:uppercase prose-h3:tracking-wider prose-h3:text-accent-green/80 prose-h3:mt-6 prose-h3:mb-3 prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-text-primary prose-code:text-accent-green prose-code:bg-bg-tertiary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:break-words prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:bg-bg-tertiary prose-pre:border prose-pre:border-border-default prose-pre:rounded-lg prose-li:text-text-secondary prose-a:text-accent-green prose-table:text-xs prose-th:text-text-muted prose-th:font-medium prose-th:uppercase prose-th:tracking-wider prose-th:text-[10px] prose-th:pb-2 prose-td:text-text-secondary prose-td:py-1.5 prose-hr:border-border-default prose-hr:my-5">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
