
import React, { useRef, useEffect } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css'; // Ensure CSS is imported if your setup supports it, otherwise rely on index.html link
import { ArrowLeft, Lock, Bookmark, Download } from './Icons';

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

  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  useEffect(() => {
    if (!containerRef.current || isLocked) return;

    // 1. Clean up previous instance
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // 2. Determine target element
    let target: HTMLElement | null = null;
    
    if (isEmbed) {
       target = containerRef.current.querySelector('.plyr__video-embed');
    } else {
       target = containerRef.current.querySelector('video');
    }

    if (!target) return;

    // 3. Initialize Plyr
    const player = new Plyr(target, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      settings: ['captions', 'quality', 'speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      autoplay: false,
      hideControls: true, // Auto hide controls
      resetOnEnd: true,
    });

    playerRef.current = player;

    // 4. Event Listeners
    player.on('ended', () => {
      if (onEnded) onEnded();
    });

    player.on('timeupdate', () => {
      if (onProgress) {
        onProgress(player.currentTime, player.duration);
      }
    });

    player.on('ready', () => {
      if (initialTime && initialTime > 0) {
        player.currentTime = initialTime;
      }
    });

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src, isLocked, isEmbed]);

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
    <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group ${className || 'aspect-video'}`} ref={containerRef}>
      {/* Custom Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-20 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="pointer-events-auto">
            {onBack && (
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

      {isEmbed ? (
        <div className="plyr__video-embed w-full h-full">
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
          controls
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
