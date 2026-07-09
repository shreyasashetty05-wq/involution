import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function FileAttachment({ file }: { file: any }) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    
    useEffect(() => {
        let isMounted = true;
        
        const fetchUrl = async () => {
            const supabase = createClient();
            
            const { data, error } = await supabase.storage
                .from('deal-room-files')
                .createSignedUrl(file.path, 3600); // 1 hour expiry
            
            if (!isMounted) return;

            if (error) {
                // Ignore "not found" errors caused by intentional deletion
                if (error.message?.toLowerCase().includes('not found') || error.name === 'StorageApiError') {
                    setNotFound(true);
                } else {
                    console.error("createSignedUrl error:", error);
                }
            }

            if (data?.signedUrl) {
                setUrl(data.signedUrl);
            }
            setLoading(false);
        };
        fetchUrl();

        return () => {
            isMounted = false;
        };
    }, [file.path]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImage = file.type.startsWith('image/');

    if (notFound) return null;

    if (loading) {
        return <div className="flex items-center gap-2 text-xs text-slate-500 my-2"><Loader2 className="size-4 animate-spin" /> Loading attachment...</div>;
    }

    if (!url) {
        return <div className="text-xs text-red-500 my-2">Failed to load attachment.</div>;
    }

    if (isImage) {
        return (
            <div className="mt-2 mb-1 max-w-sm rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group">
                <img src={url} alt={file.name} className="w-full h-auto object-cover max-h-60" />
                <a href={url} download={file.name} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="size-4" />
                </a>
            </div>
        );
    }

    return (
        <div className="mt-2 mb-1 flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm max-w-sm">
            <div className="size-10 shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                <FileText className="size-5" />
            </div>
            <div className="grow min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
            </div>
            <a href={url} download={file.name} target="_blank" rel="noreferrer" className="shrink-0 p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200">
                <Download className="size-4" />
            </a>
        </div>
    );
}
