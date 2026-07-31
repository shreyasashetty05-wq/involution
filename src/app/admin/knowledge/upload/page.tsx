'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeCategory } from '@/lib/types/knowledge';
import { ArrowLeft, UploadCloud, Loader2, FileVideo } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function UploadVideoPage() {
    const router = useRouter();
    const supabase = createClient();
    const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [tags, setTags] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [duration, setDuration] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('knowledge_categories').select('*').order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !youtubeUrl) {
            setError('Title and YouTube URL are required.');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadProgress(10);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            setUploadProgress(50);

            // 2. Upload Thumbnail if exists
            let thumbnailUrl = null;
            if (thumbnailFile) {
                const thumbExt = thumbnailFile.name.split('.').pop();
                const thumbName = `${uuidv4()}.${thumbExt}`;
                const { error: thumbUploadError } = await supabase.storage
                    .from('knowledge_hub')
                    .upload(`thumbnails/${thumbName}`, thumbnailFile);
                
                if (thumbUploadError) throw thumbUploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('knowledge_hub')
                    .getPublicUrl(`thumbnails/${thumbName}`);
                thumbnailUrl = publicUrl;
            }
            setUploadProgress(80);

            // 3. Create DB Record
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            const durationInt = duration ? parseInt(duration, 10) : null;

            const { error: dbError } = await supabase.from('knowledge_videos').insert({
                title,
                description,
                url: youtubeUrl,
                thumbnail_url: thumbnailUrl,
                duration: durationInt,
                category_id: categoryId || null,
                tags: tagsArray,
                visibility,
                created_by: user.id
            });

            if (dbError) throw dbError;

            setUploadProgress(100);
            router.push('/admin/knowledge');
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'An error occurred during upload.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Link href="/admin/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
                <ArrowLeft className="size-4" />
                Back to Knowledge Hub Management
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 mb-8">Upload Video</h1>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleUpload} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Video Title <span className="text-rose-500">*</span></label>
                        <input 
                            type="text" 
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                            placeholder="Enter video title"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Category</label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Description</label>
                    <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                        placeholder="Detailed description of the video content..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Visibility</label>
                        <select
                            value={visibility}
                            onChange={e => setVisibility(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                            <option value="public">Public</option>
                            <option value="featured">Featured</option>
                            <option value="hidden">Hidden</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
                        <input 
                            type="text" 
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                            placeholder="e.g. finance, startup, fundraising"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">YouTube URL <span className="text-rose-500">*</span></label>
                            <input 
                                type="url" 
                                required
                                value={youtubeUrl}
                                onChange={e => setYoutubeUrl(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Duration (in seconds, optional)</label>
                            <input 
                                type="number" 
                                min="0"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                placeholder="e.g. 120"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Thumbnail Image (Optional)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => {
                                if (e.target.files && e.target.files[0]) setThumbnailFile(e.target.files[0]);
                            }}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        />
                        {thumbnailFile && <span className="text-xs text-emerald-600 font-bold">{thumbnailFile.name} selected</span>}
                    </div>
                </div>

                {isUploading && (
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4">
                        <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isUploading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <><Loader2 className="size-4 animate-spin" /> Uploading...</>
                        ) : (
                            <><UploadCloud className="size-4" /> Publish Video</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
