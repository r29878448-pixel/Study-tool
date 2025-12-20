
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Download, Lock, Loader2, ArrowLeft, Bookmark,
  SkipBack, SkipForward, PictureInPicture
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

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onBack, className, onDownload, onBookmark, onEnded, onProgress, initialTime }) => {
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
  
  // Advanced Controls
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [doubleTapAnimation, setDoubleTapAnimation] = useState<'left' | 'right' | null>(null);
  
  const controlsTimeoutRef = useRef<any>(null);

  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  useEffect(() => {
    if (videoRef.current && initialTime && initialTime > 0) {
       videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current) return;
        // Only react if fullscreen OR element has focus/contains focus
        const isFocused = document.activeElement === containerRef.current || containerRef.current.contains(document.activeElement);
        if (!isFullscreen && !isFocused && document.activeElement?.tagName !== 'BODY') return;

        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                break;
            case 'arrowleft':
            case 'j':
                e.preventDefault();
                skip(-10);
                break;
            case 'arrowright':
            case 'l':
                e.preventDefault();
                skip(10);
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, isMuted]); 

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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
      if(videoRef.current) {
          videoRef.current.currentTime += seconds;
          setCurrentTime(videoRef.current.currentTime);
          
          // Trigger double tap animation
          setDoubleTapAnimation(seconds > 0 ? 'right' : 'left');
          setTimeout(() => setDoubleTapAnimation(null), 500);
      }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const t = videoRef.current.currentTime;
        setCurrentTime(t);
        if (onProgress) onProgress(t, videoRef.current.duration);
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

  const togglePiP = async () => {
      if(!videoRef.current) return;
      try {
          if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
          } else {
              await videoRef.current.requestPictureInPicture();
          }
      } catch (error) {
          console.error("PiP failed", error);
      }
  };

  const changePlaybackSpeed = (speed: number) => {
      if(videoRef.current) {
          videoRef.current.playbackRate = speed;
          setPlaybackSpeed(speed);
          setShowSpeedMenu(false);
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
        className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group ${isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-[9999]' : (className || 'aspect-video')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={`absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${isFullscreen || showControls ? 'opacity-100' : 'opacity-0'}`}>
           <div className="pointer-events-auto">
             {onBack && (
               <button onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); if(onBack) onBack(); }} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors shadow-lg border border-white/10">
                 <ArrowLeft className="w-5 h-5" />
               </button>
             )}
           </div>
           
           <div className="flex gap-2 pointer-events-auto">
               <button onClick={toggleFullscreen} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
               </button>
           </div>
        </div>

        <iframe 
          src={displayUrl} 
          title="Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          {...{ webkitallowfullscreen: "true", mozallowfullscreen: "true" } as any}
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group outline-none ${isFullscreen ? 'h-screen w-screen rounded-none fixed inset-0 z-[9999] flex items-center justify-center bg-black' : (className || 'aspect-video')}`}
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
        onEnded={() => { setIsPlaying(false); setShowControls(true); if(onEnded) onEnded(); }}
        playsInline
        onClick={togglePlay}
      />

      {/* Double Tap Animation Zones */}
      {doubleTapAnimation && (
          <div className={`absolute inset-y-0 ${doubleTapAnimation === 'left' ? 'left-0' : 'right-0'} w-1/3 flex items-center justify-center bg-white/10 z-20 animate-pulse`}>
              <div className="flex flex-col items-center text-white/80">
                  {doubleTapAnimation === 'left' ? <SkipBack className="w-12 h-12" /> : <SkipForward className="w-12 h-12" />}
                  <span className="text-sm font-bold">10s</span>
              </div>
          </div>
      )}

      {/* Double Tap Detectors */}
      <div className="absolute inset-0 flex z-10">
          <div className="w-1/4 h-full" onDoubleClick={(e) => { e.stopPropagation(); skip(-10); }}></div>
          <div className="flex-1 h-full" onClick={togglePlay}></div>
          <div className="w-1/4 h-full" onDoubleClick={(e) => { e.stopPropagation(); skip(10); }}></div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
          <Loader2 className="w-12 h-12 text-brand animate-spin" />
        </div>
      )}

      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/20">
              <Play className="w-10 h-10 text-white fill-current ml-1" />
           </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 transition-opacity duration-300 bg-gradient-to-b from-black/80 via-black/20 to-transparent ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         {onBack && (
            <button onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); if(onBack) onBack(); }} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-all shadow-lg border border-white/10 pointer-events-auto">
                <ArrowLeft className="w-6 h-6" />
            </button>
         )}
         <div className="flex-1"></div>
         <div className="relative pointer-events-auto">
             <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="p-2 text-white hover:bg-white/10 rounded-full transition-all flex items-center gap-1">
                 <Settings className="w-6 h-6" />
                 <span className="text-xs font-bold w-6">{playbackSpeed}x</span>
             </button>
             {showSpeedMenu && (
                 <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-xl rounded-xl p-2 min-w-[120px] shadow-2xl border border-white/10 animate-fade-in flex flex-col gap-1">
                     <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/10 mb-1">Playback Speed</div>
                     {[0.5, 1.0, 1.25, 1.5, 2.0].map(s => (
                         <button key={s} onClick={() => changePlaybackSpeed(s)} className={`px-3 py-2 text-left text-sm font-bold rounded-lg hover:bg-white/10 transition-colors ${playbackSpeed === s ? 'text-[#0056d2] bg-white/5' : 'text-white'}`}>{s}x</button>
                     ))}
                 </div>
             )}
         </div>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         {/* Progress Bar */}
         <div className="flex items-center gap-4 mb-4 group/progress">
            <span className="text-white text-xs font-mono w-10 text-right opacity-80">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:bg-[#ff0000] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all group-hover/progress:[&::-webkit-slider-thumb]:w-4 group-hover/progress:[&::-webkit-slider-thumb]:h-4 group-hover/progress:[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,0,0,0.5)] group-hover/progress:h-1.5 transition-all"
              style={{
                  backgroundImage: `linear-gradient(to right, #ff0000 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
              }}
            />
            <span className="text-white text-xs font-mono w-10 opacity-80">{formatTime(duration)}</span>
         </div>

         {/* Buttons */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <button onClick={togglePlay} className="text-white hover:text-[#0056d2] transition-colors hover:scale-110 active:scale-95">
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
               </button>
               
               <div className="flex items-center gap-4">
                   <button onClick={() => skip(-10)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all active:scale-90" title="-10s">
                       <SkipBack className="w-6 h-6" />
                   </button>
                   <button onClick={() => skip(10)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all active:scale-90" title="+10s">
                       <SkipForward className="w-6 h-6" />
                   </button>
               </div>

               <div className="group/vol flex items-center gap-3">
                   <button onClick={toggleMute} className="text-white hover:text-gray-300">
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                   </button>
                   <input 
                     type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume}
                     onChange={(e) => {
                         const v = parseFloat(e.target.value);
                         setVolume(v);
                         if(videoRef.current) videoRef.current.volume = v;
                         setIsMuted(v === 0);
                     }}
                     className="w-0 overflow-hidden group-hover/vol:w-24 transition-all h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                   />
               </div>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
                <button onClick={togglePiP} className="text-white/80 hover:text-white transition-transform hover:scale-110" title="Picture in Picture">
                    <PictureInPicture className="w-6 h-6" />
                </button>
                <button onClick={toggleFullscreen} className="text-white hover:text-[#0056d2] transition-colors transform hover:scale-110">
                   {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
