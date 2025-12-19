
import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Download, Lock, Loader2, ArrowLeft, Bookmark
} from './Icons';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  isLocked?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  onBack?: () => void;
  onDownload?: () => void;
  onEnded?: () => void;
  onBookmark?: (currentTime: number) => void;
  className?: string;
  title?: string;
}

const getEmbedUrl = (input: string) => {
  if (!input) return '';
  if (input.startsWith('blob:') || input.startsWith('file:')) return input;

  // Handle standard iframe code
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }

  // YouTube
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[7]}?autoplay=0&controls=1&modestbranding=1&rel=0&playsinline=1&fs=1`;
  }

  // Vimeo
  const vimeoMatch = input.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0&fullscreen=1`;
  }

  // Google Drive
  if (input.includes('drive.google.com')) {
    return input.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
  }

  return input;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onProgress, initialTime, onBack, onDownload, onEnded, onBookmark, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  useEffect(() => {
    if (videoRef.current && initialTime && initialTime > 0) {
       videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error("Fullscreen Error:", err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying || isEmbed) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (isLocked || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (isLocked) {
    return (
      <div className={`w-full ${className || 'aspect-video'} bg-gray-900 flex flex-col items-center justify-center text-white rounded-xl shadow-inner`}>
        <Lock className="w-12 h-12 mb-2 text-gray-500" />
        <p className="text-gray-400 font-medium">Content Locked</p>
      </div>
    );
  }

  if (isEmbed) {
    return (
      <div 
        ref={containerRef}
        className={`w-full bg-black rounded-xl overflow-hidden shadow-2xl relative group ${isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-[9999]' : (className || 'aspect-video')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="pointer-events-auto">
            {onBack && !isFullscreen && (
                <button onClick={onBack} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            </div>
            <div className="flex gap-2 pointer-events-auto">
                <button onClick={toggleFullscreen} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                    {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
                </button>
            </div>
        </div>
        <iframe 
          src={displayUrl} 
          title="Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl ${isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-[9999]' : (className || 'aspect-video')} select-none`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={() => {
            if(videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                onProgress?.(videoRef.current.currentTime, videoRef.current.duration);
            }
        }}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        onClick={togglePlay}
        playsInline
      />
      
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-30 flex justify-between items-start transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
         {onBack && !isFullscreen && (
            <button onClick={onBack} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                <ArrowLeft className="w-6 h-6" />
            </button>
         )}
         <div className="flex-1"></div>
         <button onClick={toggleFullscreen} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
            {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
         </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none">
           <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      )}

      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10" onClick={togglePlay}>
          <div className="w-16 h-16 rounded-full bg-brand/90 flex items-center justify-center shadow-xl backdrop-blur-sm hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 mb-2">
           <span className="text-white text-xs font-mono">{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
           <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  if(videoRef.current) videoRef.current.currentTime = t;
                  setCurrentTime(t);
              }}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
           />
           <span className="text-white text-xs font-mono">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={togglePlay} className="text-white hover:text-brand transition-colors">
               {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
             </button>
             
             <div className="flex items-center gap-2 group/volume">
               <button onClick={() => {
                   if(videoRef.current) {
                       videoRef.current.muted = !isMuted;
                       setIsMuted(!isMuted);
                   }
               }} className="text-white hover:text-gray-300">
                 {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
               </button>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white text-xs font-bold border border-white/30 px-2 py-1 rounded hover:bg-white/20 relative"
            >
                {playbackSpeed}x
                {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white rounded-lg shadow-xl overflow-hidden min-w-[80px]">
                    {[0.5, 1, 1.5, 2].map(speed => (
                        <div key={speed} onClick={() => {
                            if(videoRef.current) videoRef.current.playbackRate = speed;
                            setPlaybackSpeed(speed);
                        }} className="px-4 py-2 hover:bg-white/20">{speed}x</div>
                    ))}
                    </div>
                )}
            </button>
            {onDownload && (
                <button onClick={onDownload} className="text-white hover:text-brand transition-colors">
                   <Download className="w-5 h-5" />
                </button>
            )}
             {onBookmark && (
                <button onClick={() => onBookmark(currentTime)} className="text-white hover:text-brand transition-colors">
                   <Bookmark className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
