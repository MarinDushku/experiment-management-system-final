import React, { useState, useEffect, useRef } from 'react';

const QuestionStep = ({ step, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(step.duration);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef(null);
  
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
      // Time's up - submit whatever answer is there
      handleSubmit();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleSubmit = () => {
    // Here you could save the answer to backend if needed
    console.log("Question answer:", answer);
    
    // Move to next step
    onComplete();
  };
  
  return (
    <>
      <div className="step-content">
        <div className="question-step">
          <div className="question-text">
            {step.details && step.details.question 
              ? step.details.question 
              : 'Please answer the following question:'}
          </div>
          
          <div className="question-form">
            <textarea 
              placeholder="Enter your answer here..."
              rows="4"
              className="question-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              ref={answerRef}
            />
            
            <button 
              className="btn-primary"
              onClick={handleSubmit}
            >
              Submit Answer
            </button>
          </div>
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

export default QuestionStep;