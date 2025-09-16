import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from '../AudioPlayer';

describe('AudioPlayer Component', () => {
  const defaultProps = {
    audioSrc: '/test-audio.mp3',
    duration: 180,
    onEnded: jest.fn()
  };

  // Mock Audio instance
  let mockAudioInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh Audio instance mock for each test
    mockAudioInstance = {
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      currentTime: 0,
      duration: 180,
      src: '',
      onended: null
    };
    
    // Mock the global Audio constructor
    global.Audio = jest.fn(() => mockAudioInstance);
  });

  it('renders audio player controls', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('creates Audio instance with correct source', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    expect(global.Audio).toHaveBeenCalledWith('/test-audio.mp3');
    expect(mockAudioInstance.src).toBe('/test-audio.mp3');
  });

  it('attempts to play audio on mount', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('sets up event listeners', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
  });

  it('displays play button initially', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    const playButton = screen.getByRole('button');
    expect(playButton).toHaveClass('play-button');
    expect(playButton).toHaveTextContent('▶');
  });

  it('toggles play/pause when button clicked', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    const playButton = screen.getByRole('button');
    
    // First click should pause (assuming auto-play succeeded)
    fireEvent.click(playButton);
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    
    // Second click should play
    fireEvent.click(playButton);
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('formats time correctly', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    expect(screen.getByText('0:00')).toBeInTheDocument(); // Current time
    expect(screen.getByText('3:00')).toBeInTheDocument(); // Duration
  });

  it('formats time with double digits correctly', () => {
    const props = { ...defaultProps, duration: 3665 }; // 1:01:05
    render(<AudioPlayer {...props} />);
    
    expect(screen.getByText('61:05')).toBeInTheDocument(); // Duration (simplified formatting)
  });

  it('calls onEnded when audio ends', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    // Get the ended callback that was registered
    const endedCallback = mockAudioInstance.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )[1];
    
    // Simulate audio ending
    endedCallback();
    
    expect(defaultProps.onEnded).toHaveBeenCalled();
  });

  it('updates progress bar based on time', () => {
    render(<AudioPlayer {...defaultProps} />);
    
    // Get the timeupdate callback
    const timeUpdateCallback = mockAudioInstance.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )[1];
    
    // Simulate time update (halfway through)
    mockAudioInstance.currentTime = 90;
    timeUpdateCallback();
    
    const progressFill = document.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '50%' });
  });

  it('cleans up audio and event listeners on unmount', () => {
    const { unmount } = render(<AudioPlayer {...defaultProps} />);
    
    unmount();
    
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(mockAudioInstance.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudioInstance.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
  });

  it('handles audio play error gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAudioInstance.play.mockRejectedValue(new Error('Play failed'));
    
    render(<AudioPlayer {...defaultProps} />);
    
    expect(mockAudioInstance.play).toHaveBeenCalled();
    // Should not crash the component
    
    consoleSpy.mockRestore();
  });

  it('uses fallback duration when audio duration is not available', () => {
    mockAudioInstance.duration = NaN;
    
    render(<AudioPlayer {...defaultProps} />);
    
    // Get the timeupdate callback
    const timeUpdateCallback = mockAudioInstance.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )[1];
    
    // Simulate time update
    mockAudioInstance.currentTime = 90;
    timeUpdateCallback();
    
    const progressFill = document.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '50%' }); // Should use prop duration
  });

  it('handles missing onEnded callback gracefully', () => {
    const propsWithoutCallback = { ...defaultProps, onEnded: undefined };
    render(<AudioPlayer {...propsWithoutCallback} />);
    
    // Get the ended callback
    const endedCallback = mockAudioInstance.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )[1];
    
    // Should not crash when called without callback
    expect(() => endedCallback()).not.toThrow();
  });
});