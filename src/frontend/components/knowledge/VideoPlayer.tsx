'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { KnowledgeVideo, KnowledgeWatchHistory } from '@/lib/types/knowledge';
import { extractYouTubeId } from '@/utils/youtube';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface VideoPlayerProps {
    video: KnowledgeVideo;
    initialWatchHistory?: KnowledgeWatchHistory;
    userId?: string;
}

export default function VideoPlayer({ video, initialWatchHistory, userId }: VideoPlayerProps) {
    const [progress, setProgress] = useState(initialWatchHistory?.progress_seconds || 0);
    const [isCompleted, setIsCompleted] = useState(initialWatchHistory?.is_completed || false);
    const supabase = createClient();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);
    
    const videoId = extractYouTubeId(video.url);

    useEffect(() => {
        if (!videoId) return;

        // 1. Load YouTube IFrame API script if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
        }

        // 2. Initialize Player
        const initPlayer = () => {
            if (!iframeRef.current || playerRef.current) return;
            
            playerRef.current = new window.YT.Player(iframeRef.current, {
                events: {
                    'onReady': () => {
                        // Seek to previous progress if any
                        if (progress > 0 && !isCompleted) {
                            playerRef.current.seekTo(progress, true);
                        }
                    },
                    'onStateChange': (event: any) => {
                        // event.data === 0 means video ended
                        if (event.data === 0) {
                            setIsCompleted(true);
                            if (userId) {
                                supabase.from('knowledge_watch_history').upsert({
                                    user_id: userId,
                                    video_id: video.id,
                                    progress_seconds: Math.floor(playerRef.current.getDuration() || 0),
                                    is_completed: true,
                                    updated_at: new Date().toISOString()
                                }, { onConflict: 'user_id,video_id' });
                            }
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        // 3. Track progress every 5 seconds
        const interval = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime && !isCompleted) {
                const currentTime = Math.floor(playerRef.current.getCurrentTime());
                // Only update if difference is significant to avoid spamming DB
                if (currentTime > 0 && Math.abs(currentTime - progress) >= 5) {
                    setProgress(currentTime);
                    if (userId) {
                        supabase.from('knowledge_watch_history').upsert({
                            user_id: userId,
                            video_id: video.id,
                            progress_seconds: currentTime,
                            is_completed: isCompleted,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,video_id' });
                    }
                }
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            // DO NOT destroy the player here as React Strict Mode will break the iframe
        };
    }, [videoId, video.id, userId, isCompleted, progress, supabase]);

    // Use official YouTube Embed URL with enablejsapi=1 for tracking
    if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&modestbranding=1`;
        return (
            <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-lg relative">
                <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
                {isCompleted && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-10">
                        <span>Course Completed</span>
                    </div>
                )}
            </div>
        );
    }

    // Fallback for native files (legacy .mp4)
    return (
        <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-lg relative">
            <video 
                src={video.url} 
                controls 
                className="w-full h-full"
                onEnded={() => {
                    setIsCompleted(true);
                    if (userId) {
                        supabase.from('knowledge_watch_history').upsert({
                            user_id: userId,
                            video_id: video.id,
                            progress_seconds: 9999,
                            is_completed: true,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,video_id' });
                    }
                }}
            />
            {isCompleted && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-10">
                    <span>Course Completed</span>
                </div>
            )}
        </div>
    );
}
