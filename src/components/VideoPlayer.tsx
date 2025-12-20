
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { ArrowLeft, Lock, Bookmark, Download, SkipBack, SkipForward, Play, Pause, Settings, Maximize, Minimize, Volume2, VolumeX, Loader2 } from './Icons';

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

// Helper to normalize URLs for Plyr
const getEmbedUrl = (input: string) => {
  if (!input) return '';
  if (input.startsWith('blob:') || input.startsWith('file:')) return input;

  // 1. YouTube
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[7]}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`;
  }

  // 2. Vimeo
  const vimeoMatch = input.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?loop=false&byline=false&portrait=false&title=false&speed=true&transparent=0&gesture=media`;
  }

  return input;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  isLocked, 
  onBack, 
  className, 
  onEnded, 
  onProgress, 
  initialTime,
  onDownload,
  onBookmark
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);
  
  // State for Custom Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [skipFeedback, setSkipFeedback] = useState<{ side: 'left' | 'right' } | null>(null);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  // --- Handlers ---

  const togglePlay = useCallback(() => {
    if (playerRef.current?.playing) {
      playerRef.current.pause();
    } else {
      playerRef.current?.play();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    const newTime = playerRef.current.currentTime + seconds;
    playerRef.current.currentTime = newTime;
    
    // Show visual feedback
    if (seconds < 0) setSkipFeedback({ side: 'left' });
    else setSkipFeedback({ side: 'right' });
    setTimeout(() => setSkipFeedback(null), 600);
  }, []);

  // Double tap handler
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent, side: 'left' | 'right' | 'center') => {
    e.stopPropagation(); // Stop bubbling
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300) {
      // Double Tap
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      lastTapRef.current = 0;

      if (side === 'left') skip(-10);
      if (side === 'right') skip(10);
      if (side === 'center') togglePlay(); // Double tap center just toggles play/pause usually, or enters fullscreen? Let's stick to play/pause or nothing.
    } else {
      // Single Tap
      lastTapRef.current = now;
      if (side === 'center') {
          // Only trigger play toggle on delay if it's the center
          clickTimeoutRef.current = setTimeout(() => {
            togglePlay();
          }, 300);
      } else {
          // Side taps show controls on single tap
          setShowControls(prev => !prev);
      }
    }
  }, [skip, togglePlay]);

  const toggleFullscreen = useCallback(() => {
    // We use a "CSS Fullscreen" approach for better vertical support
    setIsFullscreen(prev => !prev);
  }, []);

  const handleSpeedChange = (speed: number) => {
    if (playerRef.current) {
        playerRef.current.speed = speed;
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- Effects ---

  useEffect(() => {
    if (!containerRef.current || isLocked) return;

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    let target: HTMLElement | null = null;
    if (isEmbed) {
       target = containerRef.current.querySelector('.plyr__video-embed');
    } else {
       target = containerRef.current.querySelector('video');
    }

    if (!target) return;

    const player = new Plyr(target, {
      controls: [], // We are hiding default controls to use our custom overlay
      settings: ['quality', 'speed'],
      autoplay: false,
      clickToPlay: false, // We handle clicks manually
      displayDuration: true,
      fullscreen: { enabled: false, fallback: false, iosNative: false } // Disable native fs to use our CSS fs
    });

    playerRef.current = player;

    // Sync State with Plyr
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => {
        setCurrentTime(player.currentTime);
        if (onProgress) onProgress(player.currentTime, player.duration);
    });
    player.on('loadedmetadata', () => setDuration(player.duration));
    player.on('ended', () => {
        setIsPlaying(false);
        if (onEnded) onEnded();
    });
    player.on('volumechange', () => {
        setVolume(player.volume);
        setIsMuted(player.muted);
    });

    player.on('ready', () => {
      if (initialTime && initialTime > 0) {
        player.currentTime = initialTime;
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src, isLocked, isEmbed]);

  // Auto-hide controls
  useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;
      if (isPlaying && showControls) {
          timeout = setTimeout(() => setShowControls(false), 3000);
      }
      return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);


  if (isLocked) {
    return (
      <div className={`w-full ${className || 'aspect-video'} bg-gray-900 flex flex-col items-center justify-center text-white rounded-xl shadow-inner relative overflow-hidden`}>
        {onBack && (
          <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors z-20">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>
        <div className="z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-200 font-bold text-lg">Content Locked</p>
            <p className="text-gray-500 text-xs mt-1">Purchase access to view</p>
        </div>
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        className={`bg-black overflow-hidden shadow-2xl group transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : `relative w-full ${className || 'aspect-video'} rounded-xl`}`}
        onMouseMove={() => setShowControls(true)}
        onClick={() => setShowControls(true)}
    >
      
      {/* Invisible Tap Zones for Gestures */}
      <div className="absolute inset-0 z-10 flex flex-row">
          {/* Left Zone (Rewind) */}
          <div 
            className="w-[30%] h-full cursor-pointer"
            onClick={(e) => handleTap(e, 'left')}
          ></div>
          
          {/* Center Zone (Controls Toggle) */}
          <div 
            className="flex-1 h-full cursor-pointer"
            onClick={(e) => handleTap(e, 'center')}
          ></div>

          {/* Right Zone (Forward) */}
          <div 
            className="w-[30%] h-full cursor-pointer"
            onClick={(e) => handleTap(e, 'right')}
          ></div>
      </div>

      {/* Skip Animation Feedback */}
      {skipFeedback && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none text-white/90 animate-ping ${skipFeedback.side === 'left' ? 'left-1/4' : 'right-1/4'}`}>
            <div className="bg-black/60 backdrop-blur-md rounded-full p-4 mb-2">
                {skipFeedback.side === 'left' ? <SkipBack className="w-8 h-8" fill="white" /> : <SkipForward className="w-8 h-8" fill="white" />}
            </div>
            <span className="text-xs font-bold font-mono">10s</span>
        </div>
      )}

      {/* Top Header Overlay */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-30 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="pointer-events-auto">
            {onBack && !isFullscreen && (
            <button 
                onClick={(e) => { e.stopPropagation(); onBack(); }} 
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            )}
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
            {onBookmark && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBookmark(playerRef.current?.currentTime || 0); }}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                    title="Bookmark"
                >
                    <Bookmark className="w-5 h-5" />
                </button>
            )}
            {onDownload && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                    title="Download"
                >
                    <Download className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      {/* Center Big Play Button (Visible when paused and controls showing) */}
      {!isPlaying && showControls && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="pointer-events-auto w-16 h-16 bg-brand/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
              >
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </button>
          </div>
      )}

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-3 group/timeline">
           <span className="text-white text-[10px] font-mono w-10 text-right">{formatTime(currentTime)}</span>
           <div className="flex-1 relative h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all">
              <div 
                className="absolute top-0 left-0 h-full bg-brand rounded-full relative" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/timeline:scale-100 transition-transform"></div>
              </div>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (playerRef.current) playerRef.current.currentTime = time;
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
           </div>
           <span className="text-white text-[10px] font-mono w-10">{formatTime(duration)}</span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-brand transition-colors">
               {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
             </button>
             
             {/* 10 Second Skip Buttons */}
             <div className="flex items-center gap-4">
                 <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white/80 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full">
                    <SkipBack className="w-5 h-5" />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white/80 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full">
                    <SkipForward className="w-5 h-5" />
                 </button>
             </div>

             <div className="hidden sm:flex items-center gap-2 group/volume">
               <button onClick={() => { if(playerRef.current) playerRef.current.muted = !isMuted; setIsMuted(!isMuted); }} className="text-white hover:text-gray-300">
                 {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
               </button>
               <input 
                 type="range" min="0" max="1" step="0.1"
                 value={isMuted ? 0 : volume}
                 onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setVolume(val);
                   if(playerRef.current) {
                       playerRef.current.volume = val;
                       playerRef.current.muted = val === 0;
                   }
                 }}
                 className="w-0 overflow-hidden group-hover/volume:w-20 transition-all h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
               />
             </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Control */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                className="text-white text-[10px] font-bold border border-white/30 px-2 py-1 rounded hover:bg-white/20"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                 <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white rounded-lg shadow-xl overflow-hidden min-w-[80px] text-sm z-50">
                   {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                     <button 
                       key={speed}
                       onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }}
                       className={`block w-full text-left px-4 py-2 hover:bg-white/20 ${playbackSpeed === speed ? 'text-brand font-bold' : ''}`}
                     >
                       {speed}x
                     </button>
                   ))}
                 </div>
              )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white hover:text-brand transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
                {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isEmbed ? (
        <div className="plyr__video-embed w-full h-full pointer-events-none">
          <iframe
            src={displayUrl}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Video Content"
            className="w-full h-full"
          />
        </div>
      ) : (
        <video
          src={displayUrl}
          poster={poster}
          className="plyr w-full h-full"
          playsInline
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
