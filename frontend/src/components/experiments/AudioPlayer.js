import React, { useEffect, useState } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ audioSrc, onEnded, duration }) => {
  const [audio] = useState(new Audio(audioSrc));
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Set up audio element
  useEffect(() => {
    // Set up event listeners
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Set the audio src
    audio.src = audioSrc;
    
    // Start playing automatically
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error('Error playing audio:', err);
    });
    
    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioSrc]);
  
  const handleTimeUpdate = () => {
    const current = audio.currentTime;
    const totalDuration = audio.duration || duration;
    const progressPercent = (current / totalDuration) * 100;
    
    setCurrentTime(current);
    setProgress(progressPercent);
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };
  
  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="audio-player">
      <div className="audio-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;