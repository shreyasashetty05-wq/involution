'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeCategory } from '@/lib/types/knowledge';
import { ArrowLeft, UploadCloud, Loader2, Youtube, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '@/utils/youtube';

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
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    // Live preview state
    const [videoId, setVideoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('knowledge_categories').select('*').order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, [supabase]);

    useEffect(() => {
        const id = extractYouTubeId(youtubeUrl);
        setVideoId(id);
    }, [youtubeUrl]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !youtubeUrl.trim()) {
            setError('Title and YouTube URL are required.');
            return;
        }

        const extractedId = extractYouTubeId(youtubeUrl);
        if (!extractedId) {
            setError('Please enter a valid YouTube video URL.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Check for duplicates
            const cleanEmbedUrl = getYouTubeEmbedUrl(extractedId);
            const { data: existing } = await supabase
                .from('knowledge_videos')
                .select('id')
                .eq('url', cleanEmbedUrl)
                .maybeSingle();

            if (existing) {
                throw new Error('This YouTube video has already been added to the Knowledge Hub.');
            }

            // 2. Upload Custom Thumbnail or fallback to YouTube thumbnail
            let thumbnailUrl = getYouTubeThumbnail(extractedId);

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

            // 3. Create DB Record
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            const { error: dbError } = await supabase.from('knowledge_videos').insert({
                title,
                description,
                url: cleanEmbedUrl,
                thumbnail_url: thumbnailUrl,
                category_id: categoryId || null,
                tags: tagsArray,
                visibility,
                created_by: user.id
            });

            if (dbError) throw dbError;

            router.push('/admin/knowledge');
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'An error occurred during publishing.');
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href="/admin/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
                <ArrowLeft className="size-4" />
                Back to Knowledge Hub Management
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 mb-8">Publish Video</h1>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleUpload} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">YouTube URL <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                            <input 
                                type="url" 
                                required
                                value={youtubeUrl}
                                onChange={e => setYoutubeUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                    </div>

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

                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                        <label className="text-sm font-bold text-slate-700">Custom Thumbnail (Optional)</label>
                        <div className="text-xs text-slate-500 mb-2">If left empty, the official YouTube thumbnail will be used automatically.</div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200">
                                <ImageIcon className="size-4" />
                                {thumbnailFile ? 'Change File' : 'Upload Image'}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) setThumbnailFile(e.target.files[0]);
                                    }}
                                    className="hidden"
                                />
                            </label>
                            {thumbnailFile && (
                                <span className="text-sm text-emerald-600 font-bold truncate max-w-xs">{thumbnailFile.name}</span>
                            )}
                        </div>
                    </div>

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
                            disabled={isUploading || !videoId}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <><Loader2 className="size-4 animate-spin" /> Publishing...</>
                            ) : (
                                <><UploadCloud className="size-4" /> Publish Video</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Live Preview Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-4">Live Preview</h3>
                        
                        {videoId ? (
                            <div className="flex flex-col gap-4">
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getYouTubeEmbedUrl(videoId)}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="font-bold text-slate-900 line-clamp-2">{title || 'Video Title'}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">{description || 'No description provided.'}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-slate-500">Thumbnail Preview:</span>
                                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                                        {thumbnailFile ? (
                                            <img src={URL.createObjectURL(thumbnailFile)} alt="Custom thumbnail preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={getYouTubeThumbnail(videoId)} alt="YouTube thumbnail preview" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium p-4 text-center">
                                Enter a valid YouTube URL to see the preview
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
