/**
 * Formats a given date string into a relative time representation.
 * @param dateString The ISO date string or Date object.
 * @returns A string like "just now", "5 minutes ago", "yesterday", etc.
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);

    if (diffSeconds < 60) {
        return "just now";
    } else if (diffMinutes === 1) {
        return "1 minute ago";
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffHours === 1) {
        return "1 hour ago";
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return "yesterday";
    } else if (diffDays < 30) {
        return `${diffDays} days ago`;
    } else if (diffMonths === 1) {
        return "1 month ago";
    } else if (diffMonths < 12) {
        return `${diffMonths} months ago`;
    } else if (diffYears === 1) {
        return "1 year ago";
    } else {
        return `${diffYears} years ago`;
    }
}
