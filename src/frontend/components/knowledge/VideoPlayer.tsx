'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo, KnowledgeWatchHistory } from '@/lib/types/knowledge';

interface VideoPlayerProps {
    video: KnowledgeVideo;
    initialWatchHistory?: KnowledgeWatchHistory;
    userId?: string;
}

export default function VideoPlayer({ video, initialWatchHistory, userId }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(initialWatchHistory?.progress_seconds || 0);
    const [isCompleted, setIsCompleted] = useState(initialWatchHistory?.is_completed || false);
    const supabase = createClient();
    
    // Resume watching from where user left off
    useEffect(() => {
        if (videoRef.current && progress > 0 && !isCompleted) {
            videoRef.current.currentTime = progress;
        }
    }, [videoRef, isCompleted]);

    // Update progress debounced
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || !userId) return;

            const currentProgress = Math.floor(videoRef.current.currentTime);
            const duration = videoRef.current.duration;
            const percentage = (currentProgress / duration) * 100;
            
            // Mark as completed if > 90% watched
            const completed = percentage > 90;

            if (currentProgress !== progress || completed !== isCompleted) {
                setProgress(currentProgress);
                if (completed) setIsCompleted(true);
                
                await supabase
                    .from('knowledge_watch_history')
                    .upsert({
                        user_id: userId,
                        video_id: video.id,
                        progress_seconds: currentProgress,
                        is_completed: completed,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,video_id' });
            }
        }, 5000); // every 5 seconds

        return () => clearInterval(interval);
    }, [userId, video.id, progress, isCompleted, supabase]);

    return (
        <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-lg relative">
            <video
                ref={videoRef}
                src={video.url}
                poster={video.thumbnail_url || undefined}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain"
                onEnded={async () => {
                    setIsCompleted(true);
                    if (userId) {
                        await supabase
                            .from('knowledge_watch_history')
                            .upsert({
                                user_id: userId,
                                video_id: video.id,
                                progress_seconds: Math.floor(videoRef.current?.duration || 0),
                                is_completed: true,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id,video_id' });
                    }
                }}
            />
            {isCompleted && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span>Course Completed</span>
                </div>
            )}
        </div>
    );
}
