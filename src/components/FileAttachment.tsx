import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function FileAttachment({ file }: { file: any }) {
    const [url, setUrl] = useState<string | null>(file.previewUrl || null);
    const [urlLoading, setUrlLoading] = useState(!file.previewUrl);
    const [imageLoading, setImageLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    
    useEffect(() => {
        if (file.previewUrl) return; // Use optimistic preview if available
        let isMounted = true;
        
        const fetchUrl = async () => {
            const supabase = createClient();
            
            const { data, error } = await supabase.storage
                .from('deal-room-files')
                .createSignedUrl(file.path, 3600); // 1 hour expiry
            
            if (!isMounted) return;

            if (error) {
                if (error.message?.toLowerCase().includes('not found') || error.name === 'StorageApiError') {
                    setNotFound(true);
                } else {
                    console.error("createSignedUrl error:", error);
                }
            }

            if (data?.signedUrl) {
                setUrl(data.signedUrl);
            }
            setUrlLoading(false);
        };
        fetchUrl();

        return () => {
            isMounted = false;
        };
    }, [file.path, file.previewUrl]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImage = file.type.startsWith('image/');

    if (notFound) return null;

    if (isImage) {
        return (
            <div className="mt-2 mb-1 w-[280px] h-[200px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100/50 flex items-center justify-center">
                {(urlLoading || file.isUploading) && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <Loader2 className="size-6 text-emerald-600 animate-spin" />
                    </div>
                )}
                {url && (
                    <img src={url} alt={file.name} 
                         className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading && !file.previewUrl ? 'opacity-0' : 'opacity-100'}`} 
                         onLoad={() => setImageLoading(false)} />
                )}
                {!file.isUploading && url && (!imageLoading || file.previewUrl) && (
                    <a href={url} download={file.name} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <Download className="size-4" />
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="mt-2 mb-1 flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm w-[280px]">
            <div className="size-10 shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 relative overflow-hidden">
                {file.isUploading ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
            </div>
            <div className="grow min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
            </div>
            {!file.isUploading && (
                urlLoading ? (
                    <Loader2 className="size-4 animate-spin text-slate-400 shrink-0 mr-2" />
                ) : url ? (
                    <a href={url} download={file.name} target="_blank" rel="noreferrer" className="shrink-0 p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200">
                        <Download className="size-4" />
                    </a>
                ) : (
                    <div className="text-[10px] text-red-500">Failed</div>
                )
            )}
        </div>
    );
}
