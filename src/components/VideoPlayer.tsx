
import React from 'react';
import { Lock, ArrowLeft } from './Icons';

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

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, isLocked, onBack, className }) => {
  const isDirectFile = src.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(src);
  const isEmbed = !isDirectFile;
  const displayUrl = isEmbed ? getEmbedUrl(src) : src;

  if (isLocked) {
    return (
      <div className={`w-full ${className || 'aspect-video'} bg-gray-900 flex flex-col items-center justify-center text-white rounded-xl shadow-inner`}>
        <Lock className="w-12 h-12 mb-2 text-gray-500" />
        <p className="text-gray-400 font-medium">Content Locked</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-lg ${className || 'aspect-video'}`}>
      {onBack && (
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-20 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      
      {isEmbed ? (
        <iframe 
          src={displayUrl} 
          title="Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          controls
          controlsList="nodownload"
          playsInline
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
