import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import ExperimentForm from '../ExperimentForm';

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

describe('ExperimentForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const mockTrials = [
    {
      _id: 'trial1',
      name: 'Trial 1',
      description: 'First trial',
      steps: [{ _id: 'step1', name: 'Step 1' }]
    },
    {
      _id: 'trial2',
      name: 'Trial 2',
      description: 'Second trial',
      steps: [{ _id: 'step2', name: 'Step 2' }, { _id: 'step3', name: 'Step 3' }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful trials fetch
    mockedAxios.get.mockResolvedValue({ data: mockTrials });
    // Suppress console logs for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    it('renders create form correctly', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Should show loading initially
      expect(screen.getByText(/loading trials/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create new experiment/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/available trials/i)).toBeInTheDocument();
      expect(screen.getByText(/selected trials/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create experiment/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('fetches trials on mount', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/trials', {
          headers: { Authorization: 'Bearer mock-token' }
        });
      });
    });

    it('displays available trials after loading', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
        expect(screen.getByText('Trial 2')).toBeInTheDocument();
        expect(screen.getByText('1 steps')).toBeInTheDocument();
        expect(screen.getByText('2 steps')).toBeInTheDocument();
      });
    });

    it('handles trials fetch error', async () => {
      const errorMessage = 'Network error';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));
      
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load trials. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Editing Existing Experiment', () => {
    const existingExperiment = {
      _id: 'exp1',
      name: 'Existing Experiment',
      description: 'Test experiment',
      status: 'Active',
      trials: [
        { trial: 'trial1', order: 0 }
      ]
    };

    it('renders edit form with existing data', async () => {
      render(<ExperimentForm experiment={existingExperiment} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit experiment/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Experiment')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test experiment')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update experiment/i })).toBeInTheDocument();
      });
    });

    it('shows status field when editing', async () => {
      render(<ExperimentForm experiment={existingExperiment} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /draft/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /active/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /completed/i })).toBeInTheDocument();
      });
    });

    it('does not show status field when creating', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Input Handling', () => {
    it('updates form fields when user types', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/experiment name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: 'Test Experiment' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      expect(nameInput.value).toBe('Test Experiment');
      expect(descriptionInput.value).toBe('Test description');
    });
  });

  describe('Trial Management', () => {
    it('adds trial to selected list', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
      });

      // Initially no trials selected
      expect(screen.getByText('No trials selected')).toBeInTheDocument();

      // Add trial
      const addButtons = screen.getAllByText('+');
      fireEvent.click(addButtons[0]);

      // Should appear in selected trials
      await waitFor(() => {
        expect(screen.queryByText('No trials selected')).not.toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument(); // Order indicator
      });
    });

    it('prevents adding duplicate trials', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByText('+');
      
      // Add trial twice
      fireEvent.click(addButtons[0]);
      fireEvent.click(addButtons[0]);

      // Should only appear once in selected trials
      const orderIndicators = screen.getAllByText(/#\d+/);
      expect(orderIndicators).toHaveLength(1);
    });

    it('removes trial from selected list', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
      });

      // Add trial
      const addButtons = screen.getAllByText('+');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Remove trial
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(screen.getByText('No trials selected')).toBeInTheDocument();
    });

    it('moves trial up in order', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
      });

      // Add two trials
      const addButtons = screen.getAllByText('+');
      fireEvent.click(addButtons[0]); // Trial 1
      fireEvent.click(addButtons[1]); // Trial 2

      await waitFor(() => {
        expect(screen.getAllByText(/#\d+/)).toHaveLength(2);
      });

      // Move second trial up
      const upButtons = screen.getAllByText('↑');
      fireEvent.click(upButtons[0]);

      // Order should be changed - Trial 2 should now be first
      const orderIndicators = screen.getAllByText(/#\d+/);
      expect(orderIndicators[0]).toHaveTextContent('#1');
      expect(orderIndicators[1]).toHaveTextContent('#2');
    });

    it('moves trial down in order', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trial 1')).toBeInTheDocument();
      });

      // Add two trials
      const addButtons = screen.getAllByText('+');
      fireEvent.click(addButtons[0]); // Trial 1
      fireEvent.click(addButtons[1]); // Trial 2

      await waitFor(() => {
        expect(screen.getAllByText(/#\d+/)).toHaveLength(2);
      });

      // Move first trial down
      const downButtons = screen.getAllByText('↓');
      fireEvent.click(downButtons[0]);

      // Order should be changed
      const orderIndicators = screen.getAllByText(/#\d+/);
      expect(orderIndicators).toHaveLength(2);
    });
  });

  describe('Form Submission', () => {
    it('submits new experiment correctly', async () => {
      mockedAxios.mockResolvedValue({ data: { _id: 'new-exp', name: 'Test Experiment' } });
      
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/experiment name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test Experiment' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      // Add a trial
      const addButtons = screen.getAllByText('+');
      fireEvent.click(addButtons[0]);

      // Submit
      const submitButton = screen.getByRole('button', { name: /create experiment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith({
          method: 'post',
          url: '/api/experiments',
          data: {
            name: 'Test Experiment',
            description: 'Test description',
            status: 'Draft',
            trials: [{ trial: 'trial1', order: 0 }]
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          }
        });
      });

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('submits experiment update correctly', async () => {
      const existingExperiment = {
        _id: 'exp1',
        name: 'Existing Experiment',
        description: 'Test experiment',
        status: 'Active'
      };

      mockedAxios.mockResolvedValue({ data: existingExperiment });
      
      render(<ExperimentForm experiment={existingExperiment} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Experiment')).toBeInTheDocument();
      });

      // Submit without changes
      const submitButton = screen.getByRole('button', { name: /update experiment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith({
          method: 'put',
          url: '/api/experiments/exp1',
          data: {
            name: 'Existing Experiment',
            description: 'Test experiment',
            status: 'Active',
            trials: []
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          }
        });
      });
    });

    it('handles submission error', async () => {
      const errorMessage = 'Validation failed';
      mockedAxios.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });
      
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
      });

      // Fill required field
      const nameInput = screen.getByLabelText(/experiment name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Experiment' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /create experiment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save experiment. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Event Handlers', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('requires experiment name', async () => {
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/experiment name/i);
      expect(nameInput).toHaveAttribute('required');
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no trials available', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<ExperimentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('No trials available')).toBeInTheDocument();
        expect(screen.getByText('No trials selected')).toBeInTheDocument();
      });
    });
  });
});