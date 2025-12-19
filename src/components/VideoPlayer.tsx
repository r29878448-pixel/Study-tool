
import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Download, Lock, Loader2, ArrowLeft, Bookmark
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
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    const videoId = ytMatch[7];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&fs=1&color=white`;
  }
  const vimeoMatch = input.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0&fullscreen=1`;
  }
  if (input.includes('drive.google.com')) {
    return input.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
  }
  if (input.includes('loom.com/share')) {
      return input.replace('/share/', '/embed/');
  }
  return input;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onProgress, initialTime, onBack, onDownload, onEnded, onBookmark, className, title }) => {
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

  const isDirectFile = /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  useEffect(() => {
    if (videoRef.current && initialTime && initialTime > 0) {
       videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  const togglePlay = () => {
    if (isLocked || !videoRef.current || isEmbed) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.error("Play error", e));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying || isEmbed) setShowControls(false);
    }, 3000);
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
      >
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="pointer-events-auto">
            {onBack && !isFullscreen && (
                <button onClick={onBack} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            </div>
            <div className="flex gap-2 pointer-events-auto">
                <button onClick={toggleFullscreen} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                    {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
                </button>
            </div>
        </div>
        <iframe 
          src={displayUrl} 
          title={title || "Video Player"}
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
      tabIndex={0}
      className={`relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl ${isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-[9999]' : (className || 'aspect-video')} select-none outline-none`}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            onProgress?.(videoRef.current.currentTime, videoRef.current.duration);
          }
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        onClick={togglePlay}
        playsInline
      />
      {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none"><Loader2 className="w-12 h-12 text-white animate-spin" /></div>}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10" onClick={togglePlay}>
          <div className="w-16 h-16 rounded-full bg-brand/90 flex items-center justify-center shadow-xl backdrop-blur-sm hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
