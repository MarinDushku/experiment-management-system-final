import React, { useState, useEffect, useRef } from 'react';

const MusicStep = ({ step, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(step.duration);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  
  // Set up and play audio when component mounts
  useEffect(() => {
    // Reset timer
    setTimeRemaining(parseInt(step.duration) || 30);
    
    // Set up audio if there's an audio file
    if (step.details && step.details.audioFile) {
      // Create the proper URL for the audio file
      const audioUrl = step.details.audioFile.startsWith('/')
        ? step.details.audioFile
        : `/${step.details.audioFile}`;
      
      console.log("Loading audio file from:", audioUrl);
      
      // Create a new audio element
      const audioElement = new Audio(audioUrl);
      audioElement.volume = 1.0;
      
      // Set up event listeners
      audioElement.oncanplaythrough = () => {
        console.log("Audio can play through, starting playback");
        audioElement.play()
          .then(() => {
            console.log("Audio playback started successfully");
            setIsAudioPlaying(true);
          })
          .catch(e => {
            console.error("Error playing audio:", e);
            setIsAudioPlaying(false);
          });
      };
      
      audioElement.onended = () => {
        console.log("Audio ended naturally");
        setIsAudioPlaying(false);
      };
      
      // Store the audio element
      audioRef.current = audioElement;
    }
    
    // Clean up function
    return () => {
      if (audioRef.current) {
        console.log("Cleaning up audio element");
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
        setIsAudioPlaying(false);
      }
    };
  }, [step]);
  
  // Handle timer countdown
  useEffect(() => {
    let timer;
    
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      
      // Move to next step
      onComplete();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining, onComplete]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const manualPlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(e => {
          console.error("Error playing audio:", e);
        });
    }
  };
  
  return (
    <>
      <div className="step-content">
        <div className="music-step">
          <div className="music-icon">🎵</div>
          <p>{isAudioPlaying ? 'Music is playing...' : 'Preparing music...'}</p>
          {!isAudioPlaying && audioRef.current && (
            <button 
              onClick={manualPlayAudio}
              className="btn-primary play-button"
            >
              Play Music
            </button>
          )}
        </div>
      </div>
      
      <div className="step-footer">
        <div className="timer">
          <div className="time-remaining">
            {formatTime(timeRemaining)}
          </div>
          <div className="timer-label">remaining</div>
        </div>
      </div>
    </>
  );
};

export default MusicStep;