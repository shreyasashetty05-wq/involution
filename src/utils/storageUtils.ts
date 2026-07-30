export const BUCKETS = ['startup', 'incubation', 'investors', 'deal-room-files'];

/**
 * Recursively scans a JSON object (or array/string) for Supabase Storage public URLs.
 * Extracts the bucket name and the file path.
 * 
 * @param obj The object to scan (can be an entity record like a startup or deal).
 * @param supabaseUrl The NEXT_PUBLIC_SUPABASE_URL.
 * @returns Array of { bucket, path } representing found storage files.
 */
export function extractStoragePaths(obj: any, supabaseUrl: string): { bucket: string, path: string }[] {
    const results: { bucket: string, path: string }[] = [];
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/`;

    const scan = (item: any) => {
        if (!item) return;

        if (typeof item === 'string') {
            if (item.startsWith(baseUrl)) {
                // Remove the base url
                const remaining = item.slice(baseUrl.length);
                // The first part is the bucket name, the rest is the path
                const parts = remaining.split('/');
                if (parts.length > 1) {
                    const bucket = parts[0];
                    // The path is everything after the bucket name
                    const path = parts.slice(1).join('/');
                    // Decode URI component because supabase returns encoded paths for files with spaces
                    results.push({ bucket, path: decodeURIComponent(path) });
                }
            }
        } else if (Array.isArray(item)) {
            item.forEach(scan);
        } else if (typeof item === 'object') {
            Object.values(item).forEach(scan);
        }
    };

    scan(obj);
    return results;
}
