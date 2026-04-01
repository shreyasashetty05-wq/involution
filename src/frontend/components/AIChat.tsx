"use client";

import { useState } from 'react';
import { Bot, Send, Loader2, User, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AIChatProps {
    startupId: string;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
    feedback?: 'upvote' | 'downvote';
}

export default function AIChat({ startupId }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Hello! I'm the InVolution AI Analyst. I've analyzed this startup's profile. What would you like to know?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFeedback = async (index: number, type: 'upvote' | 'downvote') => {
        const msg = messages[index];
        if (msg.role !== 'ai' || msg.feedback) return;

        setMessages(prev => prev.map((m, i) => i === index ? { ...m, feedback: type } : m));

        try {
            await fetch('/api/ai-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    module: 'chat',
                    context: index > 0 ? messages[index - 1].content : '',
                    aiResponse: msg.content,
                    feedbackType: type
                })
            });
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startupId, question: userMessage })
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error analyzing that request." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, there was a network error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 p-4 border-b border-gray-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">InVolution AI Analyst</h3>
                    <p className="text-xs text-gray-400">Ask anything about this startup</p>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-emerald-400" />
                            </div>
                        )}
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                            {msg.role === 'ai' && i > 0 && (
                                <div className="flex items-center gap-2 mt-1 ml-1">
                                    <button
                                        onClick={() => handleFeedback(i, 'upvote')}
                                        disabled={!!msg.feedback}
                                        className={`p-1 rounded hover:bg-gray-800 transition-colors ${msg.feedback === 'upvote' ? 'text-emerald-400' : 'text-gray-500'}`}
                                        title="Good response"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleFeedback(i, 'downvote')}
                                        disabled={!!msg.feedback}
                                        className={`p-1 rounded hover:bg-gray-800 transition-colors ${msg.feedback === 'downvote' ? 'text-red-400' : 'text-gray-500'}`}
                                        title="Bad response"
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-gray-800 text-emerald-400 rounded-tl-none border border-gray-700 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Analyzing data...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. What is the biggest risk here?"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
