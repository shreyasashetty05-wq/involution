import { useState, useEffect } from "react";
import { Download, FileText, Loader2, X, ExternalLink, PlayCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createPortal } from "react-dom";

export default function FileAttachment({ file }: { file: any }) {
    const [url, setUrl] = useState<string | null>(file.previewUrl || null);
    const [urlLoading, setUrlLoading] = useState(!file.previewUrl);
    const [imageLoading, setImageLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    
    const [viewerOpen, setViewerOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
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

    // Close on escape
    useEffect(() => {
        if (!viewerOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setViewerOpen(false);
                setIsZoomed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewerOpen]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url || isDownloading) return;
        
        setIsDownloading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.name || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (err) {
            console.error('Download failed, falling back', err);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsDownloading(false);
        }
    };

    if (notFound) return null;

    const renderViewer = () => {
        if (!viewerOpen || typeof document === 'undefined') return null;

        return createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-opacity animate-in fade-in duration-200" 
                 onClick={() => { setViewerOpen(false); setIsZoomed(false); }}>
                {/* Controls */}
                <div className="absolute top-4 right-4 flex gap-4 z-50">
                    {isPdf && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(url!, '_blank'); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors" title="Open in New Tab">
                            <ExternalLink className="size-5" />
                        </button>
                    )}
                    <button onClick={handleDownload} disabled={isDownloading} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-50" title="Download">
                        {isDownloading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setViewerOpen(false); setIsZoomed(false); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors" title="Close">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative w-full h-full flex items-center justify-center overflow-auto" onClick={(e) => {
                    if (isImage) {
                        e.stopPropagation();
                        setIsZoomed(!isZoomed);
                    } else {
                        e.stopPropagation();
                    }
                }}>
                    {isImage && url && (
                        <img src={url} alt={file.name} 
                            className={`transition-all duration-300 ${isZoomed ? 'cursor-zoom-out min-w-full min-h-full object-contain scale-[1.5]' : 'cursor-zoom-in max-w-full max-h-full object-contain'}`} 
                        />
                    )}
                    {isVideo && url && (
                        <video src={url} controls autoPlay className="max-w-full max-h-full outline-none rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    )}
                    {isPdf && url && (
                        <iframe src={url} className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl" title={file.name} />
                    )}
                    {!isImage && !isVideo && !isPdf && (
                        <div className="bg-white p-8 rounded-2xl flex flex-col items-center max-w-sm text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <FileText className="size-16 text-indigo-500 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2">{file.name}</h3>
                            <p className="text-sm text-slate-500 mb-6">{formatBytes(file.size)} • {file.type}</p>
                            <button onClick={handleDownload} disabled={isDownloading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                                {isDownloading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />} {isDownloading ? "Downloading..." : "Download File"}
                            </button>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    if (isImage || isVideo) {
        return (
            <>
                <div 
                    onClick={() => { if (!file.isUploading && url) setViewerOpen(true); }}
                    className={`mt-2 mb-1 w-[280px] h-[200px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100/50 flex items-center justify-center ${(!file.isUploading && url) ? 'cursor-pointer' : ''}`}
                >
                    {(urlLoading || file.isUploading) && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <Loader2 className="size-6 text-emerald-600 animate-spin" />
                        </div>
                    )}
                    {url && isImage && (
                        <img src={url} alt={file.name} 
                             className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading && !file.previewUrl ? 'opacity-0' : 'opacity-100'}`} 
                             onLoad={() => setImageLoading(false)} />
                    )}
                    {url && isVideo && (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <PlayCircle className="size-12 text-white/80" />
                        </div>
                    )}
                    {!file.isUploading && url && (!imageLoading || file.previewUrl || isVideo) && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(e);
                            }} 
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            title="Download"
                        >
                            {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        </div>
                    )}
                </div>
                {renderViewer()}
            </>
        );
    }

    return (
        <>
            <div 
                onClick={() => { if (!file.isUploading && url) setViewerOpen(true); }}
                className={`mt-2 mb-1 flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm w-[280px] ${(!file.isUploading && url) ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
            >
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
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(e);
                            }} 
                            className="shrink-0 p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                            title="Download"
                        >
                            {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        </button>
                    ) : (
                        <div className="text-[10px] text-red-500">Failed</div>
                    )
                )}
            </div>
            {renderViewer()}
        </>
    );
}
