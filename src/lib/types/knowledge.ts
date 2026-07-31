export interface KnowledgeCategory {
    id: string;
    name: string;
    created_at: string;
}

export interface KnowledgeVideo {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail_url: string | null;
    duration: number | null;
    category_id: string | null;
    tags: string[];
    views: number;
    visibility: 'public' | 'hidden' | 'featured' | 'draft';
    created_by: string | null;
    created_at: string;
    updated_at: string;
    knowledge_categories?: KnowledgeCategory;
}

export interface KnowledgeWatchHistory {
    id: string;
    user_id: string;
    video_id: string;
    progress_seconds: number;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface KnowledgeAttachment {
    id: string;
    video_id: string;
    title: string;
    url: string;
    created_at: string;
}
