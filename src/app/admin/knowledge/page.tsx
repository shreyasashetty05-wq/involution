'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo } from '@/lib/types/knowledge';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, PlayCircle, Loader2 } from 'lucide-react';

export default function AdminKnowledgeHubPage() {
    const [videos, setVideos] = useState<KnowledgeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchVideos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('knowledge_videos')
            .select('*, knowledge_categories(name)')
            .order('created_at', { ascending: false });
        
        if (data) setVideos(data as KnowledgeVideo[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        await supabase.from('knowledge_videos').delete().eq('id', id);
        fetchVideos();
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Knowledge Hub Management</h1>
                    <p className="text-slate-500 mt-1">Manage educational videos and categories.</p>
                </div>
                <Link 
                    href="/admin/knowledge/upload" 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
                >
                    <Plus className="size-5" />
                    Upload Video
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                        <PlayCircle className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Videos</p>
                        <p className="text-3xl font-black text-slate-900">{videos.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <Eye className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Views</p>
                        <p className="text-3xl font-black text-slate-900">{videos.reduce((sum, v) => sum + v.views, 0)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Video</th>
                                <th className="p-4 font-bold">Category</th>
                                <th className="p-4 font-bold">Visibility</th>
                                <th className="p-4 font-bold">Views</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <Loader2 className="size-8 text-emerald-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : videos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No videos uploaded yet.
                                    </td>
                                </tr>
                            ) : (
                                videos.map(video => (
                                    <tr key={video.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-12 bg-slate-200 rounded overflow-hidden relative shrink-0">
                                                    {video.thumbnail_url ? (
                                                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <PlayCircle className="size-6 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 line-clamp-1">{video.title}</p>
                                                    <p className="text-xs text-slate-500">{new Date(video.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                                                {video.knowledge_categories?.name || 'None'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                video.visibility === 'public' ? 'bg-emerald-100 text-emerald-800' :
                                                video.visibility === 'featured' ? 'bg-purple-100 text-purple-800' :
                                                video.visibility === 'draft' ? 'bg-amber-100 text-amber-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {video.visibility}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700">{video.views.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/knowledge/${video.id}`} target="_blank" className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="View">
                                                    <Eye className="size-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(video.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
