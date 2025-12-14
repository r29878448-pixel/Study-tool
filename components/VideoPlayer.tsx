
import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Download, Lock, Loader2
} from './Icons';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  isLocked?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  initialTime?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onProgress, initialTime }) => {
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

  const isYoutube = src.includes('youtube.com') || src.includes('youtu.be') || src.includes('youtube-nocookie.com');

  // Set initial time if provided (e.g. from saved progress)
  useEffect(() => {
    if (videoRef.current && initialTime) {
       videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  // Keyboard Shortcuts & Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only react if the container is focused or body is focused (not typing in an input)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      // If we are not fullscreen, only react if body or player is focused
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
    
    if (videoElement && !isYoutube) {
      videoElement.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      if (videoElement && !isYoutube) {
        videoElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [isYoutube]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    if (isLocked || !videoRef.current || isYoutube) return;
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
      if (initialTime) videoRef.current.currentTime = initialTime;
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
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const handleMouseMove = () => {
    if (isYoutube) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  if (isLocked) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex flex-col items-center justify-center text-white rounded-lg">
        <Lock className="w-12 h-12 mb-2 text-gray-500" />
        <p className="text-gray-400">Content Locked</p>
      </div>
    );
  }

  // YouTube Player (Iframe)
  if (isYoutube) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        <iframe 
          src={src} 
          title="Video Player"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Native Player (MP4)
  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className="relative group w-full bg-black rounded-lg overflow-hidden shadow-lg aspect-video select-none outline-none"
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
        onClick={togglePlay}
        controlsList="nodownload" // Built-in download disabled, using custom
      />
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none">
           <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      )}

      {/* Center Play Button Overlay (Only show if NOT playing and NOT loading) */}
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

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Progress Bar */}
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

        {/* Buttons Row */}
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
            <div className="text-white/70 text-[10px] border border-white/20 px-1.5 py-0.5 rounded font-medium cursor-help" title="Auto Quality">
               HD
            </div>

            {/* Download */}
            <a 
              href={src} 
              download 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-brand transition-colors"
              title="Download Video"
            >
               <Download className="w-5 h-5" />
            </a>

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
