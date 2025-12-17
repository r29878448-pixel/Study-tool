
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
  className?: string;
  title?: string;
}

// Helper to clean and extract URL from various inputs
const getEmbedUrl = (input: string) => {
  if (!input) return '';

  // 1. Handle raw <iframe> code paste
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }

  // 2. YouTube (Handles Shorts, Watch, Embed, youtu.be)
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    const videoId = ytMatch[7];
    // Uses modest branding and stricter policies to look cleaner
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&controls=1&showinfo=0&iv_load_policy=3&fs=1`;
  }

  // 3. Vimeo
  const vimeoMatch = input.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
  }

  // 4. Google Drive
  if (input.includes('drive.google.com')) {
    return input.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
  }

  // 5. Loom
  if (input.includes('loom.com/share')) {
      return input.replace('/share/', '/embed/');
  }

  // 6. Generic fallback (return as is if it looks like a URL)
  return input;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onProgress, initialTime, onBack, onDownload, onEnded, className, title }) => {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (!isFullscreen && !containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 5;
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 5;
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen]); 

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const videoElement = videoRef.current;
    if (videoElement && isDirectFile) {
      videoElement.addEventListener('contextmenu', handleContextMenu);
    }
    return () => {
      if (videoElement && isDirectFile) {
        videoElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [isDirectFile]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (onProgress) {
        onProgress(time, videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialTime && initialTime > 0) videoRef.current.currentTime = initialTime;
    }
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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
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

  // Embed Player
  if (isEmbed) {
    return (
      <div 
        ref={containerRef}
        className={`w-full bg-black rounded-xl overflow-hidden shadow-2xl relative group ${isFullscreen ? 'h-full w-full rounded-none' : (className || 'aspect-video')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Header Overlay for Embeds */}
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="pointer-events-auto">
            {onBack && (
                <button 
                    onClick={onBack}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
                {onDownload && (
                    <button 
                        onClick={onDownload}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                        title="Save to Offline Library"
                    >
                        <Bookmark className="w-5 h-5" />
                    </button>
                )}
                <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
                </button>
            </div>
        </div>

        <iframe 
          src={displayUrl} 
          title="Video Player"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Native Player
  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={`relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl ${isFullscreen ? 'h-full w-full rounded-none' : (className || 'aspect-video')} select-none outline-none`}
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
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); if (onEnded) onEnded(); }}
        onClick={togglePlay}
        controlsList="nodownload"
        playsInline
      />
      
      {/* Top Controls Overlay */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-30 flex justify-between items-start transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
         {onBack && (
            <button 
                onClick={onBack}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
         )}
         <div className="flex-1"></div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none">
           <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      )}

      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-brand/90 flex items-center justify-center shadow-xl backdrop-blur-sm hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 mb-2">
           <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
           <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
           />
           <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={togglePlay} className="text-white hover:text-brand transition-colors">
               {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
             </button>
             
             <div className="flex items-center gap-2 group/volume">
               <button onClick={toggleMute} className="text-white hover:text-gray-300">
                 {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
               </button>
               <input 
                 type="range" min="0" max="1" step="0.1"
                 value={isMuted ? 0 : volume}
                 onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setVolume(val);
                   if(videoRef.current) videoRef.current.volume = val;
                   setIsMuted(val === 0);
                 }}
                 className="w-0 overflow-hidden group-hover/volume:w-20 transition-all h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
               />
             </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Control */}
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white text-xs font-bold border border-white/30 px-2 py-1 rounded hover:bg-white/20"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                 <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white rounded-lg shadow-xl overflow-hidden min-w-[80px] text-sm">
                   {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                     <button 
                       key={speed}
                       onClick={() => handleSpeedChange(speed)}
                       className={`block w-full text-left px-4 py-2 hover:bg-white/20 ${playbackSpeed === speed ? 'text-brand' : ''}`}
                     >
                       {speed}x
                     </button>
                   ))}
                 </div>
              )}
            </div>

            {/* Quality Badge (Visual Only) */}
            <div className="text-white/70 text-[10px] border border-white/20 px-1.5 py-0.5 rounded font-medium cursor-help hidden sm:block" title="Auto Quality">
               HD
            </div>

            {/* Download */}
            {onDownload && (
                <button 
                  onClick={onDownload}
                  className="text-white hover:text-brand transition-colors"
                  title="Download to Phone"
                >
                   <Download className="w-5 h-5" />
                </button>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-brand transition-colors">
               {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
