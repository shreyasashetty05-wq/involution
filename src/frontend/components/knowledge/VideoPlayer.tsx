'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo, KnowledgeWatchHistory } from '@/lib/types/knowledge';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
    video: KnowledgeVideo;
    initialWatchHistory?: KnowledgeWatchHistory;
    userId?: string;
}

export default function VideoPlayer({ video, initialWatchHistory, userId }: VideoPlayerProps) {
    const playerRef = useRef<ReactPlayer>(null);
    const [progress, setProgress] = useState(initialWatchHistory?.progress_seconds || 0);
    const [isCompleted, setIsCompleted] = useState(initialWatchHistory?.is_completed || false);
    const supabase = createClient();
    
    // To ensure we only seek once when the video is ready
    const [hasSeeked, setHasSeeked] = useState(false);

    const handleProgress = async (state: { playedSeconds: number, played: number }) => {
        if (!userId) return;

        const currentProgress = Math.floor(state.playedSeconds);
        const completed = state.played > 0.9; // Consider 90% as completed

        // Only update state & db if significant change (e.g. 5 seconds diff or newly completed)
        if (Math.abs(currentProgress - progress) >= 5 || (completed && !isCompleted)) {
            setProgress(currentProgress);
            if (completed) setIsCompleted(true);
            
            await supabase
                .from('knowledge_watch_history')
                .upsert({
                    user_id: userId,
                    video_id: video.id,
                    progress_seconds: currentProgress,
                    is_completed: completed || isCompleted,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,video_id' });
        }
    };

    const handleReady = () => {
        if (!hasSeeked && progress > 0 && !isCompleted && playerRef.current) {
            playerRef.current.seekTo(progress, 'seconds');
            setHasSeeked(true);
        }
    };

    const handleEnded = async () => {
        setIsCompleted(true);
        if (userId) {
            await supabase
                .from('knowledge_watch_history')
                .upsert({
                    user_id: userId,
                    video_id: video.id,
                    progress_seconds: Math.floor(playerRef.current?.getDuration() || video.duration || 0),
                    is_completed: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,video_id' });
        }
    };

    return (
        <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-lg relative">
            <ReactPlayer
                ref={playerRef}
                url={video.url}
                width="100%"
                height="100%"
                controls={true}
                onProgress={handleProgress}
                onReady={handleReady}
                onEnded={handleEnded}
                progressInterval={5000}
                config={{
                    youtube: {
                        playerVars: { modestbranding: 1 }
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
