import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/utils/timeHelper';
import { KnowledgeVideo } from '@/lib/types/knowledge';
import { PlayCircle, CheckCircle2 } from 'lucide-react';

interface VideoCardProps {
    video: KnowledgeVideo;
    watchHistory?: { progress_seconds: number, is_completed: boolean };
}

export default function VideoCard({ video, watchHistory }: VideoCardProps) {
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progressPercentage = watchHistory && video.duration
        ? Math.min(100, (watchHistory.progress_seconds / video.duration) * 100)
        : 0;

    return (
        <Link href={`/knowledge/${video.id}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {video.thumbnail_url ? (
                    <Image 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-slate-200 text-slate-400">
                        <PlayCircle className="size-12 opacity-50" />
                    </div>
                )}
                
                {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {formatDuration(video.duration)}
                    </div>
                )}
                
                {/* Watch Progress Bar */}
                {watchHistory && !watchHistory.is_completed && progressPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30">
                        <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                        {video.title}
                    </h3>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-grow">
                    {video.description}
                </p>

                <div className="mt-auto flex flex-col gap-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {video.knowledge_categories?.name || 'Uncategorized'}
                        </span>
                        {watchHistory?.is_completed && (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3" /> Completed
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between font-medium">
                        <span>{video.views.toLocaleString()} views</span>
                        <span>{formatRelativeTime(new Date(video.created_at))}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
