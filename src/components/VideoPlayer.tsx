
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Minimize, ArrowLeft } from './Icons';

interface VideoPlayerProps {
  src: string;
  onBack?: () => void;
  title?: string;
}

const getEmbedUrl = (input: string) => {
  if (!input) return '';
  const ytMatch = input.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  if (ytMatch && ytMatch[7]?.length === 11) {
    const videoId = ytMatch[7];
    // modestbranding=1, rel=0, and iv_load_policy=3 hide most channel info and overlays
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`;
  }
  return input;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onBack, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEmbed = !/\.(mp4|webm|ogg|mov)($|\?)/i.test(src);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div ref={containerRef} className={`relative bg-black w-full overflow-hidden ${isFullscreen ? 'h-screen' : 'aspect-video rounded-xl shadow-2xl'}`}>
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <button onClick={toggleFullscreen} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      {isEmbed ? (
        <iframe 
          src={getEmbedUrl(src)} 
          className="w-full h-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
        />
      ) : (
        <video src={src} controls className="w-full h-full object-contain" poster="" />
      )}
    </div>
  );
};

export default VideoPlayer;
