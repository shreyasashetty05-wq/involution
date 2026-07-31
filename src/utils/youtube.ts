export function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[8].length === 11) ? match[8] : null;
}

export function getYouTubeThumbnail(videoId: string): string {
    // maxresdefault is highest quality, but might not exist for all videos.
    // hqdefault is a safe fallback, but typically maxresdefault works for modern videos.
    // For simplicity, we'll try to use maxresdefault. In UI we can use an img with fallback logic.
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
}
