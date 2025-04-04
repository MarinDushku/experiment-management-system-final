import React, { useState, useEffect } from 'react';

const RestStep = ({ step, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(step.duration);
  
  // Set up timer when component mounts
  useEffect(() => {
    // Reset timer
    setTimeRemaining(parseInt(step.duration) || 30);
  }, [step]);
  
  // Handle timer countdown
  useEffect(() => {
    let timer;
    
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else {
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
  
  return (
    <>
      <div className="step-content">
        <div className="rest-step">
          <div className="rest-icon">😌</div>
          <p>{step.details && step.details.instructions 
            ? step.details.instructions 
            : 'Please rest and relax.'}
          </p>
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

export default RestStep;