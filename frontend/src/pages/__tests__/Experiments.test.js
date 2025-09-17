import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Experiments from '../Experiments';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock ExperimentForm component
jest.mock('../../components/experiments/ExperimentForm', () => {
  return function MockExperimentForm({ experiment, onSubmit, onCancel }) {
    return (
      <div data-testid="experiment-form">
        <h3>{experiment ? 'Edit Experiment' : 'Create Experiment'}</h3>
        <button onClick={() => onSubmit({ name: 'Test Experiment' })}>
          Submit Form
        </button>
        <button onClick={onCancel}>Cancel Form</button>
        {experiment && <div data-testid="editing-experiment">{experiment.name}</div>}
      </div>
    );
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.confirm and window.open
global.confirm = jest.fn();
global.open = jest.fn();

describe('Experiments Component', () => {
  const mockExperiments = [
    {
      _id: '1',
      name: 'Memory Test',
      description: 'Testing memory recall',
      status: 'Draft',
      trials: [{ name: 'Trial 1' }, { name: 'Trial 2' }]
    },
    {
      _id: '2',
      name: 'Attention Study',
      description: 'Measuring attention span',
      status: 'Active',
      trial: { name: 'Single Trial' }
    },
    {
      _id: '3',
      name: 'Completed Study',
      description: 'Already finished',
      status: 'Completed',
      trials: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(false);
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Component Loading', () => {
    it('displays loading state initially', async () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<Experiments />);
      
      expect(screen.getByText('Loading experiments...')).toBeInTheDocument();
    });

    it('renders page title and add button after loading', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(screen.getByText('Experiments Management')).toBeInTheDocument();
        expect(screen.getByText('Add New Experiment')).toBeInTheDocument();
      });
    });
  });

  describe('Experiments List Display', () => {
    it('displays experiment cards with correct information', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(screen.getByText('Memory Test')).toBeInTheDocument();
        expect(screen.getByText('Testing memory recall')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
        
        expect(screen.getByText('Attention Study')).toBeInTheDocument();
        expect(screen.getByText('Measuring attention span')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        
        expect(screen.getByText('Completed Study')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('displays trial information correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        // Check for trial information with flexible matching since text is split
        expect(screen.getAllByText('Trials:')).toHaveLength(2); // Multiple experiments have Trials:
        expect(screen.getByText(/2/)).toBeInTheDocument();
        expect(screen.getByText(/trials configured/)).toBeInTheDocument();
        expect(screen.getByText('Single Trial')).toBeInTheDocument();
        expect(screen.getByText('None assigned')).toBeInTheDocument();
      });
    });

    it('shows correct status badges with CSS classes', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      const { container } = render(<Experiments />);
      
      await waitFor(() => {
        expect(container.querySelector('.badge.draft')).toBeInTheDocument();
        expect(container.querySelector('.badge.active')).toBeInTheDocument();
        expect(container.querySelector('.badge.completed')).toBeInTheDocument();
      });
    });

    it('displays action buttons for each experiment', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
      });
    });

    it('shows Run button only for experiments with trials', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const runButtons = screen.getAllByText('Run');
        expect(runButtons).toHaveLength(2); // Only first two experiments have trials
      });
    });

    it('disables Run button for completed experiments', async () => {
      const experimentsWithCompleted = [
        {
          _id: '1',
          name: 'Completed Experiment',
          status: 'Completed',
          trials: [{ name: 'Trial 1' }]
        }
      ];
      mockedAxios.get.mockResolvedValue({ data: experimentsWithCompleted });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const runButton = screen.getByText('Run');
        expect(runButton).toBeDisabled();
      });
    });
  });

  describe('Empty State', () => {
    it('displays no data message when experiments list is empty', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(screen.getByText('No experiments found. Create one to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when initial fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load experiments. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error message when create fails', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      mockedAxios.post.mockRejectedValue(new Error('Create failed'));
      
      render(<Experiments />);
      
      // Open create form
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add New Experiment'));
      });
      
      // Submit form
      fireEvent.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create experiment. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Management', () => {
    it('opens create form when Add New button is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<Experiments />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add New Experiment'));
      });
      
      expect(screen.getByTestId('experiment-form')).toBeInTheDocument();
      expect(screen.getByText('Create Experiment')).toBeInTheDocument();
    });

    it('opens edit form when Edit button is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });
      
      expect(screen.getByTestId('experiment-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Experiment')).toBeInTheDocument();
      expect(screen.getByTestId('editing-experiment')).toHaveTextContent('Memory Test');
    });

    it('closes form when cancel is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<Experiments />);
      
      // Open form
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add New Experiment'));
      });
      
      expect(screen.getByTestId('experiment-form')).toBeInTheDocument();
      
      // Close form
      fireEvent.click(screen.getByText('Cancel Form'));
      
      expect(screen.queryByTestId('experiment-form')).not.toBeInTheDocument();
    });
  });

  describe('Create Experiment', () => {
    it('creates experiment and refreshes list', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] }) // Initial load
        .mockResolvedValueOnce({ data: [{ _id: '1', name: 'New Experiment', status: 'Draft', trials: [] }] }); // After create
      mockedAxios.post.mockResolvedValue({});
      
      render(<Experiments />);
      
      // Open create form
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add New Experiment'));
      });
      
      // Submit form - wait for it to appear first
      await waitFor(() => {
        expect(screen.getByText('Submit Form')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/experiments',
          { name: 'Test Experiment' },
          {
            headers: {
              Authorization: 'Bearer mock-token'
            }
          }
        );
      });
      
      // Form should close after successful submission
      await waitFor(() => {
        expect(screen.queryByTestId('experiment-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Update Experiment', () => {
    it('updates experiment and refreshes list', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      mockedAxios.put.mockResolvedValue({});
      
      render(<Experiments />);
      
      // Open edit form
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });
      
      // Submit form
      fireEvent.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/experiments/1',
          { name: 'Test Experiment' },
          {
            headers: {
              Authorization: 'Bearer mock-token'
            }
          }
        );
      });
    });
  });

  describe('Delete Experiment', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      global.confirm.mockReturnValue(false);
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this experiment?');
    });

    it('deletes experiment when confirmed', async () => {
      global.confirm.mockReturnValue(true);
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      mockedAxios.delete.mockResolvedValue({});
      
      render(<Experiments />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith(
          '/api/experiments/1',
          {
            headers: {
              Authorization: 'Bearer mock-token'
            }
          }
        );
      });
    });

    it('does not delete when cancelled', async () => {
      global.confirm.mockReturnValue(false);
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });
  });

  describe('Run Experiment', () => {
    it('starts experiment and opens new window', async () => {
      global.open.mockImplementation(() => {});
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      mockedAxios.post.mockResolvedValue({});
      
      render(<Experiments />);
      
      await waitFor(() => {
        const runButtons = screen.getAllByText('Run');
        fireEvent.click(runButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/experiments/1/run',
          {},
          {
            headers: {
              Authorization: 'Bearer mock-token'
            }
          }
        );
        expect(global.open).toHaveBeenCalledWith('/experiments/1/run', '_blank');
      });
    });

    it('handles run experiment error', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      mockedAxios.post.mockRejectedValue(new Error('Run failed'));
      
      render(<Experiments />);
      
      await waitFor(() => {
        const runButtons = screen.getAllByText('Run');
        fireEvent.click(runButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to start experiment. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('API Authentication', () => {
    it('includes auth token in all API calls', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/experiments',
          {
            headers: {
              Authorization: 'Bearer test-token-123'
            }
          }
        );
      });
    });

    it('handles missing token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockExperiments });
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/experiments',
          {
            headers: {
              Authorization: 'Bearer null'
            }
          }
        );
      });
    });
  });

  describe('Experiment Description Handling', () => {
    it('displays default text when description is missing', async () => {
      const experimentsWithoutDescription = [
        {
          _id: '1',
          name: 'No Description Experiment',
          status: 'Draft',
          trials: []
        }
      ];
      mockedAxios.get.mockResolvedValue({ data: experimentsWithoutDescription });
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(screen.getByText('No description provided')).toBeInTheDocument();
      });
    });
  });

  describe('Console Error Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs errors to console', async () => {
      const error = new Error('Test error');
      mockedAxios.get.mockRejectedValue(error);
      
      render(<Experiments />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });
  });
});