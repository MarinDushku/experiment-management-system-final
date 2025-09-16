import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StepForm from '../StepForm';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-file-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  onended: null,
}));

describe('StepForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creating New Step', () => {
    it('renders create form correctly', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('heading', { name: /create new step/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/step name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/step type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create step/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('has correct default values', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      expect(nameInput.value).toBe(''); // name field
      expect(screen.getByDisplayValue('Rest')).toBeInTheDocument(); // type field
      expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // duration field
    });

    it('updates form fields when user types', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      const durationInput = screen.getByLabelText(/duration/i);

      fireEvent.change(nameInput, { target: { value: 'Test Step' } });
      fireEvent.change(durationInput, { target: { value: '60' } });

      expect(nameInput.value).toBe('Test Step');
      expect(durationInput.value).toBe('60');
    });
  });

  describe('Editing Existing Step', () => {
    const existingStep = {
      name: 'Existing Step',
      type: 'Question',
      duration: 45,
      details: {
        question: 'What is your mood?',
        options: 'Happy, Sad, Neutral'
      }
    };

    it('renders edit form with existing data', () => {
      render(<StepForm step={existingStep} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('heading', { name: /edit step/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Step')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Question')).toBeInTheDocument();
      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
      expect(screen.getByDisplayValue('What is your mood?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Happy, Sad, Neutral')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update step/i })).toBeInTheDocument();
    });
  });

  describe('Step Type Specific Fields', () => {
    it('renders Rest type fields', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Default type is Rest
      expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter instructions for this rest period/i)).toBeInTheDocument();
    });

    it('renders Question type fields when type changes', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Question' } });

      expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/options/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter the question to display/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/option 1, option 2, option 3/i)).toBeInTheDocument();
      
      // Should not show Rest fields
      expect(screen.queryByLabelText(/instructions/i)).not.toBeInTheDocument();
    });

    it('renders Music type fields when type changes', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Music' } });

      expect(screen.getByLabelText(/audio file/i)).toBeInTheDocument();
      // File input should exist
      const fileInput = screen.getByLabelText(/audio file/i);
      expect(fileInput).toHaveAttribute('type', 'file');
      
      // Should not show other type fields
      expect(screen.queryByLabelText(/question/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/instructions/i)).not.toBeInTheDocument();
    });

    it('updates detail fields correctly', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Question' } });

      const questionTextarea = screen.getByLabelText(/question/i);
      const optionsInput = screen.getByLabelText(/options/i);

      fireEvent.change(questionTextarea, { target: { value: 'How are you feeling?' } });
      fireEvent.change(optionsInput, { target: { value: 'Good, Bad, Okay' } });

      expect(questionTextarea.value).toBe('How are you feeling?');
      expect(optionsInput.value).toBe('Good, Bad, Okay');
    });
  });

  describe('Audio File Handling', () => {
    it('handles file selection', async () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Music' } });

      const fileInput = screen.getByLabelText(/audio file/i);
      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      
      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play preview/i })).toBeInTheDocument();
      });
    });

    it('handles audio preview play/pause', async () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        onended: null,
      };
      global.Audio.mockImplementation(() => mockAudio);

      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Music' } });

      const fileInput = screen.getByLabelText(/audio file/i);
      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      const playButton = await waitFor(() => 
        screen.getByRole('button', { name: /play preview/i })
      );
      
      // Test play
      fireEvent.click(playButton);
      expect(global.Audio).toHaveBeenCalledWith('mock-file-url');
      expect(mockAudio.play).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause preview/i })).toBeInTheDocument();
      });

      // Test pause
      const pauseButton = screen.getByRole('button', { name: /pause preview/i });
      fireEvent.click(pauseButton);
      expect(mockAudio.pause).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play preview/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits Rest step correctly', async () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      const durationInput = screen.getByLabelText(/duration/i);
      const instructionsTextarea = screen.getByLabelText(/instructions/i);
      const submitButton = screen.getByRole('button', { name: /create step/i });

      fireEvent.change(nameInput, { target: { value: 'Rest Step' } });
      fireEvent.change(durationInput, { target: { value: '60' } });
      fireEvent.change(instructionsTextarea, { target: { value: 'Please rest quietly' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const formData = mockOnSubmit.mock.calls[0][0];
      expect(formData.get('name')).toBe('Rest Step');
      expect(formData.get('type')).toBe('Rest');
      expect(formData.get('duration')).toBe('60');
      
      const details = JSON.parse(formData.get('details'));
      expect(details.instructions).toBe('Please rest quietly');
    });

    it('submits Question step correctly', async () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      const typeSelect = screen.getByLabelText(/step type/i);
      const submitButton = screen.getByRole('button', { name: /create step/i });

      fireEvent.change(nameInput, { target: { value: 'Question Step' } });
      fireEvent.change(typeSelect, { target: { value: 'Question' } });

      const questionTextarea = screen.getByLabelText(/question/i);
      const optionsInput = screen.getByLabelText(/options/i);

      fireEvent.change(questionTextarea, { target: { value: 'How do you feel?' } });
      fireEvent.change(optionsInput, { target: { value: 'Great, Good, Okay, Bad' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const formData = mockOnSubmit.mock.calls[0][0];
      expect(formData.get('name')).toBe('Question Step');
      expect(formData.get('type')).toBe('Question');
      
      const details = JSON.parse(formData.get('details'));
      expect(details.question).toBe('How do you feel?');
      expect(details.options).toBe('Great, Good, Okay, Bad');
    });

    it('submits Music step with file correctly', async () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      const typeSelect = screen.getByLabelText(/step type/i);
      const submitButton = screen.getByRole('button', { name: /create step/i });

      fireEvent.change(nameInput, { target: { value: 'Music Step' } });
      fireEvent.change(typeSelect, { target: { value: 'Music' } });

      const fileInput = screen.getByLabelText(/audio file/i);
      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const formData = mockOnSubmit.mock.calls[0][0];
      expect(formData.get('name')).toBe('Music Step');
      expect(formData.get('type')).toBe('Music');
      expect(formData.get('audioFile')).toBe(file);
    });
  });

  describe('Form Validation', () => {
    it('requires step name', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/step name/i);
      const durationInput = screen.getByLabelText(/duration/i);

      expect(nameInput).toHaveAttribute('required');
      expect(durationInput).toHaveAttribute('required');
      expect(durationInput).toHaveAttribute('min', '1');
      expect(durationInput).toHaveAttribute('max', '3600');
    });
  });

  describe('Event Handlers', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('pauses audio on unmount', async () => {
      const mockAudio = {
        play: jest.fn(),
        pause: jest.fn(),
        onended: null,
      };
      global.Audio.mockImplementation(() => mockAudio);

      const { unmount } = render(<StepForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const typeSelect = screen.getByLabelText(/step type/i);
      fireEvent.change(typeSelect, { target: { value: 'Music' } });

      const fileInput = screen.getByLabelText(/audio file/i);
      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      const playButton = await waitFor(() =>
        screen.getByRole('button', { name: /play preview/i })
      );
      fireEvent.click(playButton);

      // Wait for audio to be playing
      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });

      unmount();
      
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });
});