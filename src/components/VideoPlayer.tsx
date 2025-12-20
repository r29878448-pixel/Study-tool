
import React, { useRef, useEffect } from 'react';
import Plyr from 'plyr';
import { ArrowLeft, Lock } from './Icons';

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

// Helper to normalize URLs for Plyr Embeds
const getEmbedUrl = (input: string) => {
  if (!input) return '';
  if (input.startsWith('blob:') || input.startsWith('file:')) return input;

  // 1. Handle raw <iframe> code paste
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }

  // 2. YouTube (Clean for Plyr)
  // Plyr handles standard YouTube links well in the wrapper, but let's normalize
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[7]}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`;
  }

  // 3. Vimeo
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
  initialTime 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  // Determine if it is a file or embed
  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  useEffect(() => {
    if (!containerRef.current || isLocked) return;

    // Destroy existing instance if any
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Initialize Plyr
    // Target the element inside the container
    const target = isEmbed ? containerRef.current.querySelector('.plyr__video-embed') : containerRef.current.querySelector('video');
    
    if (target) {
      const player = new Plyr(target as HTMLElement, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'settings',
          'fullscreen'
        ],
        settings: ['quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        autoplay: false,
        hideControls: true,
      });

      playerRef.current = player;

      // Event Listeners
      player.on('ended', () => {
        if (onEnded) onEnded();
      });

      player.on('timeupdate', () => {
        if (onProgress) {
          onProgress(player.currentTime, player.duration);
        }
      });

      // Set initial time if provided
      player.on('ready', () => {
        if (initialTime && initialTime > 0) {
          player.currentTime = initialTime;
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src, isLocked]);

  if (isLocked) {
    return (
      <div className={`w-full ${className || 'aspect-video'} bg-gray-900 flex flex-col items-center justify-center text-white rounded-xl shadow-inner relative`}>
        {onBack && (
          <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors z-20">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Lock className="w-12 h-12 mb-2 text-gray-500" />
        <p className="text-gray-400 font-medium">Content Locked</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl group ${className || 'aspect-video'}`} ref={containerRef}>
      {/* Back Button Overlay */}
      {onBack && (
        <button 
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            onBack();
          }} 
          className="absolute top-4 left-4 z-[50] p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-brand/90 transition-all shadow-lg border border-white/10 group-hover:opacity-100 opacity-0 duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

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
