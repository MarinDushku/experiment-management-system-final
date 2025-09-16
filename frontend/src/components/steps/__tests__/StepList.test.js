import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StepList from '../StepList';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.confirm
global.confirm = jest.fn();

describe('StepList Component', () => {
  const mockSteps = [
    {
      _id: '1',
      name: 'Background Music',
      type: 'Music',
      duration: 300,
      details: {
        audioFile: '/uploads/background-music.mp3'
      }
    },
    {
      _id: '2',
      name: 'Assessment Question',
      type: 'Question',
      duration: 60,
      details: {
        question: 'How do you feel right now?',
        options: 'Excellent, Good, Fair, Poor'
      }
    },
    {
      _id: '3',
      name: 'Relaxation Break',
      type: 'Rest',
      duration: 120,
      details: {
        instructions: 'Take deep breaths and relax your muscles'
      }
    },
    {
      _id: '4',
      name: 'Incomplete Music Step',
      type: 'Music',
      duration: 180,
      details: {} // Missing audio file
    },
    {
      _id: '5',
      name: 'Incomplete Question Step',
      type: 'Question',
      duration: 30,
      details: {} // Missing question and options
    }
  ];

  const mockOnEdit = jest.fn();
  const mockOnNewStep = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(false);
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Component Loading', () => {
    it('displays loading state initially', async () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      expect(screen.getByText('Loading steps...')).toBeInTheDocument();
    });

    it('renders component title and create button after loading', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Experiment Steps')).toBeInTheDocument();
        expect(screen.getByText('Create New Step')).toBeInTheDocument();
      });
    });

    it('makes correct API call to fetch steps', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/steps', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        });
      });
    });
  });

  describe('Steps List Display', () => {
    it('displays step cards with correct information', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Background Music')).toBeInTheDocument();
        expect(screen.getByText('Assessment Question')).toBeInTheDocument();
        expect(screen.getByText('Relaxation Break')).toBeInTheDocument();
      });
    });

    it('displays duration for all steps', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Duration: 300 seconds')).toBeInTheDocument();
        expect(screen.getByText('Duration: 60 seconds')).toBeInTheDocument();
        expect(screen.getByText('Duration: 120 seconds')).toBeInTheDocument();
      });
    });

    it('displays type badges with correct CSS classes', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      const { container } = render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(container.querySelector('.step-type.music')).toBeInTheDocument();
        expect(container.querySelector('.step-type.question')).toBeInTheDocument();
        expect(container.querySelector('.step-type.rest')).toBeInTheDocument();
      });
    });

    it('displays action buttons for all steps', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        expect(editButtons).toHaveLength(5);
        expect(deleteButtons).toHaveLength(5);
      });
    });
  });

  describe('Step Type Specific Details', () => {
    it('displays music step details correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Audio: /uploads/background-music.mp3')).toBeInTheDocument();
      });
    });

    it('displays question step details correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Question: How do you feel right now?')).toBeInTheDocument();
        expect(screen.getByText('Options: Excellent, Good, Fair, Poor')).toBeInTheDocument();
      });
    });

    it('displays rest step details correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Instructions: Take deep breaths and relax your muscles')).toBeInTheDocument();
      });
    });

    it('displays fallback messages for missing details', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Audio: No audio file specified')).toBeInTheDocument();
        expect(screen.getByText('Question: No question specified')).toBeInTheDocument();
        expect(screen.getByText('Options: No options specified')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays no steps message when list is empty', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('No steps found. Create your first step to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load steps. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles API error with response data', async () => {
      const apiError = {
        response: {
          data: { message: 'Unauthorized access' }
        }
      };
      mockedAxios.get.mockRejectedValue(apiError);
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load steps. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error when delete fails', async () => {
      global.confirm.mockReturnValue(true);
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      mockedAxios.delete.mockRejectedValue(new Error('Delete failed'));
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to delete step. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onNewStep when Create New Step button is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Create New Step'));
      });
      
      expect(mockOnNewStep).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit with step data when Edit button is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockSteps[0]);
    });
  });

  describe('Step Deletion', () => {
    it('shows confirmation dialog when delete button is clicked', async () => {
      global.confirm.mockReturnValue(false);
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this step?');
    });

    it('deletes step when confirmed and updates local state', async () => {
      global.confirm.mockReturnValue(true);
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      mockedAxios.delete.mockResolvedValue({});
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      // Wait for steps to load
      await waitFor(() => {
        expect(screen.getByText('Background Music')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/steps/1', {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });
      });
      
      // Step should be removed from local state
      await waitFor(() => {
        expect(screen.queryByText('Background Music')).not.toBeInTheDocument();
      });
    });

    it('does not delete when user cancels confirmation', async () => {
      global.confirm.mockReturnValue(false);
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });
  });

  describe('API Authentication', () => {
    it('includes auth token in fetch request', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/steps', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-123'
          }
        });
      });
    });

    it('includes auth token in delete request', async () => {
      global.confirm.mockReturnValue(true);
      mockLocalStorage.getItem.mockReturnValue('delete-token-456');
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      mockedAxios.delete.mockResolvedValue({});
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/steps/1', {
          headers: {
            'Authorization': 'Bearer delete-token-456'
          }
        });
      });
    });

    it('handles missing token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/steps', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null'
          }
        });
      });
    });
  });

  describe('CSS Classes and Structure', () => {
    it('applies correct CSS classes to main elements', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      const { container } = render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(container.querySelector('.step-list')).toBeInTheDocument();
        expect(container.querySelector('.step-list-header')).toBeInTheDocument();
        expect(container.querySelector('.steps-container')).toBeInTheDocument();
        expect(container.querySelector('.step-card')).toBeInTheDocument();
      });
    });

    it('applies correct classes to step elements', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      const { container } = render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(container.querySelector('.step-header')).toBeInTheDocument();
        expect(container.querySelector('.step-content')).toBeInTheDocument();
        expect(container.querySelector('.step-actions')).toBeInTheDocument();
        expect(container.querySelector('.btn-edit')).toBeInTheDocument();
        expect(container.querySelector('.btn-delete')).toBeInTheDocument();
      });
    });

    it('applies correct loading and error classes', async () => {
      // Test loading state
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));
      const { container: loadingContainer } = render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      expect(loadingContainer.querySelector('.loading')).toBeInTheDocument();
      
      // Test error state
      mockedAxios.get.mockRejectedValue(new Error('Test error'));
      const { container: errorContainer } = render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      await waitFor(() => {
        expect(errorContainer.querySelector('.error')).toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs fetch operations', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSteps });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Fetching steps...');
        expect(consoleSpy).toHaveBeenCalledWith('Steps response:', mockSteps);
      });
    });
  });

  describe('Step Details Rendering Edge Cases', () => {
    it('handles steps with null details', async () => {
      const stepsWithNullDetails = [
        {
          _id: '1',
          name: 'Step with null details',
          type: 'Music',
          duration: 60,
          details: null
        }
      ];
      
      mockedAxios.get.mockResolvedValue({ data: stepsWithNullDetails });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Audio: No audio file specified')).toBeInTheDocument();
      });
    });

    it('handles unknown step type', async () => {
      const stepsWithUnknownType = [
        {
          _id: '1',
          name: 'Unknown Type Step',
          type: 'Unknown',
          duration: 60,
          details: { instructions: 'Some instructions' }
        }
      ];
      
      mockedAxios.get.mockResolvedValue({ data: stepsWithUnknownType });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        // Should default to Rest type rendering
        expect(screen.getByText('Instructions: Some instructions')).toBeInTheDocument();
      });
    });

    it('handles empty string values in details', async () => {
      const stepsWithEmptyDetails = [
        {
          _id: '1',
          name: 'Empty Details Step',
          type: 'Question',
          duration: 60,
          details: { question: '', options: '' }
        }
      ];
      
      mockedAxios.get.mockResolvedValue({ data: stepsWithEmptyDetails });
      
      render(<StepList onEdit={mockOnEdit} onNewStep={mockOnNewStep} />);
      
      await waitFor(() => {
        expect(screen.getByText('Question: No question specified')).toBeInTheDocument();
        expect(screen.getByText('Options: No options specified')).toBeInTheDocument();
      });
    });
  });
});