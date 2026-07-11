"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-invert max-w-none text-[15px]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-[#F8FAFC] mb-4 mt-8 border-b border-[#334155] pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-[#F8FAFC] mb-3 mt-6 border-b border-[#334155] pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-semibold text-[#10B981] mb-2 mt-5 uppercase tracking-wide" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-sm font-semibold text-[#F8FAFC] mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-[#94A3B8] leading-relaxed last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 mb-5 space-y-3 shadow-sm" {...props} />,
                    ol: ({node, ...props}) => <ol className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 mb-5 space-y-3 shadow-sm list-decimal list-inside text-[#94A3B8]" {...props} />,
                    li: ({node, ...props}) => (
                        <li className="text-[#F8FAFC] text-sm ml-2 list-none relative before:content-['✓'] before:absolute before:-left-5 before:text-[#10B981] before:font-bold" {...props} />
                    ),
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto mb-5 rounded-xl border border-[#334155] bg-[#1E293B]">
                            <table className="w-full text-left text-sm" {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th className="bg-[#0F172A] px-4 py-3 font-semibold text-[#F8FAFC] border-b border-[#334155]" {...props} />,
                    td: ({node, ...props}) => <td className="px-4 py-3 text-[#94A3B8] border-b border-[#334155] last:border-0" {...props} />,
                    a: ({node, ...props}) => <a className="text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-[#F8FAFC]" {...props} />,
                    code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <div className="rounded-xl overflow-hidden my-5 border border-[#334155] shadow-sm">
                                <div className="bg-[#111827] px-4 py-2 text-xs text-[#94A3B8] border-b border-[#334155] font-mono">
                                    {match[1]}
                                </div>
                                <div className="p-4 bg-[#0F172A] overflow-x-auto">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </div>
                            </div>
                        ) : (
                            <code className="bg-[#111827] text-[#3B82F6] px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-[#334155]" {...props}>
                                {children}
                            </code>
                        )
                    },
                    hr: ({node, ...props}) => <hr className="my-8 border-[#334155]" {...props} />,
                    blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-2 border-[#10B981] pl-4 py-1 italic text-[#94A3B8] bg-[#1E293B]/50 rounded-r-lg my-5" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
