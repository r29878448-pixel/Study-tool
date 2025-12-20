
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Lock, ArrowLeft, Loader2
} from './Icons';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  isLocked?: boolean;
  onBack?: () => void;
  className?: string;
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
    return `https://www.youtube.com/embed/${ytMatch[7]}?autoplay=0&controls=1&modestbranding=1&rel=0&playsinline=1&fs=1&iv_load_policy=3`;
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

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onBack, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const controlsTimeoutRef = useRef<any>(null);

  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  // Handle Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls Visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  // Video Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  // Embed Player
  if (isEmbed) {
    return (
      <div 
        ref={containerRef}
        className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group ${isFullscreen ? 'h-screen w-screen rounded-none' : (className || 'aspect-video')}`}
      >
        <div className={`absolute top-0 left-0 p-4 z-20 transition-opacity duration-300 ${isFullscreen || showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
           {onBack && !isFullscreen && (
             <button onClick={onBack} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors">
               <ArrowLeft className="w-5 h-5" />
             </button>
           )}
        </div>
        
        {/* Fullscreen Trigger for Embeds (if needed externally) */}
        <div className="absolute bottom-4 right-4 z-20">
           <button onClick={toggleFullscreen} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
           </button>
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

  // Native Custom Player
  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group ${isFullscreen ? 'h-screen w-screen rounded-none flex items-center justify-center' : (className || 'aspect-video')}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
            setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Big Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 cursor-pointer" onClick={togglePlay}>
           <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-current ml-1" />
           </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         {onBack && !isFullscreen && (
            <button onClick={onBack} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                <ArrowLeft className="w-6 h-6" />
            </button>
         )}
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         {/* Progress Bar */}
         <div className="flex items-center gap-3 mb-2">
            <span className="text-white text-xs font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
            <span className="text-white text-xs font-mono w-10">{formatTime(duration)}</span>
         </div>

         {/* Buttons */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={togglePlay} className="text-white hover:text-brand transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
               </button>
               <button onClick={toggleMute} className="text-white hover:text-gray-300">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
               </button>
            </div>
            
            <button onClick={toggleFullscreen} className="text-white hover:text-brand transition-colors">
               {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
