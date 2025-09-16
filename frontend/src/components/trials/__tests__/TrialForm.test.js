import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TrialForm from '../TrialForm';
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

describe('TrialForm Component', () => {
  const mockAvailableSteps = [
    {
      _id: 'step1',
      name: 'Introduction',
      type: 'Rest',
      duration: 30
    },
    {
      _id: 'step2',
      name: 'Memory Task',
      type: 'Question',
      duration: 120
    },
    {
      _id: 'step3',
      name: 'Background Music',
      type: 'Music',
      duration: 300
    }
  ];

  const mockExistingTrial = {
    _id: 'trial1',
    name: 'Existing Trial',
    description: 'Test trial for editing',
    steps: [
      {
        step: {
          _id: 'step1',
          name: 'Introduction',
          type: 'Rest',
          duration: 30
        },
        order: 0
      },
      {
        step: 'step2', // Can be just ID
        order: 1
      }
    ]
  };

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Component Loading', () => {
    it('displays loading state initially', async () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByText('Loading steps...')).toBeInTheDocument();
    });

    it('fetches available steps on mount', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/steps', {
          headers: {
            Authorization: 'Bearer mock-token'
          }
        });
      });
    });

    it('displays error when steps fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load steps. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Create Mode', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
    });

    it('renders create form correctly', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Trial')).toBeInTheDocument();
        expect(screen.getByLabelText(/trial name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create trial/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('has empty initial values for create mode', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/trial name/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        
        expect(nameInput.value).toBe('');
        expect(descriptionInput.value).toBe('');
      });
    });

    it('updates form fields when user types', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/trial name/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        
        fireEvent.change(nameInput, { target: { value: 'New Trial' } });
        fireEvent.change(descriptionInput, { target: { value: 'New description' } });
        
        expect(nameInput.value).toBe('New Trial');
        expect(descriptionInput.value).toBe('New description');
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
    });

    it('renders edit form with existing data', async () => {
      render(
        <TrialForm 
          trial={mockExistingTrial} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Edit Trial')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Trial')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test trial for editing')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update trial/i })).toBeInTheDocument();
      });
    });

    it('populates steps from existing trial', async () => {
      render(
        <TrialForm 
          trial={mockExistingTrial} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        // Should show existing steps
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Memory Task')).toBeInTheDocument();
      });
    });
  });

  describe('Available Steps Display', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
    });

    it('displays available steps for selection', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Available Steps')).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Memory Task')).toBeInTheDocument();
        expect(screen.getByText('Background Music')).toBeInTheDocument();
      });
    });

    it('shows step details in available steps', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Rest')).toBeInTheDocument();
        expect(screen.getByText('Question')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('30s')).toBeInTheDocument();
        expect(screen.getByText('120s')).toBeInTheDocument();
        expect(screen.getByText('300s')).toBeInTheDocument();
      });
    });
  });

  describe('Step Management', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
    });

    it('adds step when Add button is clicked', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]); // Add Introduction step
      });
      
      // Step should appear in selected steps
      await waitFor(() => {
        const selectedStepsSection = screen.getByText('Selected Steps').parentNode;
        expect(selectedStepsSection).toHaveTextContent('Introduction');
      });
    });

    it('removes step when Remove button is clicked', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Add a step first
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      
      // Remove the step
      await waitFor(() => {
        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[0]);
      });
      
      // Step should be removed
      await waitFor(() => {
        const selectedStepsSection = screen.getByText('Selected Steps').parentNode;
        expect(selectedStepsSection).not.toHaveTextContent('Introduction');
      });
    });

    it('moves step up when up button is clicked', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Add two steps
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]); // Introduction
        fireEvent.click(addButtons[1]); // Memory Task
      });
      
      // Move second step up
      await waitFor(() => {
        const upButtons = screen.getAllByText('↑');
        fireEvent.click(upButtons[1]); // Move Memory Task up
      });
      
      // Check order changed
      await waitFor(() => {
        const stepItems = screen.getAllByClassName('selected-step-item');
        expect(stepItems[0]).toHaveTextContent('Memory Task');
        expect(stepItems[1]).toHaveTextContent('Introduction');
      });
    });

    it('moves step down when down button is clicked', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Add two steps
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]); // Introduction
        fireEvent.click(addButtons[1]); // Memory Task
      });
      
      // Move first step down
      await waitFor(() => {
        const downButtons = screen.getAllByText('↓');
        fireEvent.click(downButtons[0]); // Move Introduction down
      });
      
      // Check order changed
      await waitFor(() => {
        const stepItems = screen.getAllByClassName('selected-step-item');
        expect(stepItems[0]).toHaveTextContent('Memory Task');
        expect(stepItems[1]).toHaveTextContent('Introduction');
      });
    });

    it('disables up button for first step', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Add one step
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      
      await waitFor(() => {
        const upButtons = screen.getAllByText('↑');
        expect(upButtons[0]).toBeDisabled();
      });
    });

    it('disables down button for last step', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Add one step
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      
      await waitFor(() => {
        const downButtons = screen.getAllByText('↓');
        expect(downButtons[0]).toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
    });

    it('submits create request with correct data', async () => {
      mockedAxios.post.mockResolvedValue({ data: { _id: 'new-trial' } });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Fill form
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/trial name/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        
        fireEvent.change(nameInput, { target: { value: 'Test Trial' } });
        fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      });
      
      // Add a step
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      
      // Submit
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create trial/i });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith({
          method: 'post',
          url: '/api/trials',
          data: {
            name: 'Test Trial',
            description: 'Test description',
            steps: [
              {
                step: 'step1',
                order: 0
              }
            ]
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          }
        });
      });
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('submits update request for existing trial', async () => {
      mockedAxios.mockResolvedValue({ data: { _id: 'updated-trial' } });
      
      render(
        <TrialForm 
          trial={mockExistingTrial} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      // Wait for form to load with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Trial')).toBeInTheDocument();
      });
      
      // Submit
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /update trial/i });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith({
          method: 'put',
          url: '/api/trials/trial1',
          data: expect.objectContaining({
            name: 'Existing Trial',
            description: 'Test trial for editing'
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          }
        });
      });
    });

    it('displays error when submission fails', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      mockedAxios.post.mockRejectedValue(new Error('Submission failed'));
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Fill form and submit
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/trial name/i);
        fireEvent.change(nameInput, { target: { value: 'Test' } });
      });
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create trial/i });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save trial. Please try again.')).toBeInTheDocument();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('API Authentication', () => {
    it('includes auth token in steps fetch request', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/steps', {
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        });
      });
    });

    it('includes auth token in submission request', async () => {
      mockLocalStorage.getItem.mockReturnValue('submit-token-456');
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      mockedAxios.post.mockResolvedValue({ data: {} });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/trial name/i);
        fireEvent.change(nameInput, { target: { value: 'Test' } });
      });
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create trial/i });
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer submit-token-456'
            })
          })
        );
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

    it('logs fetched steps', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Fetched steps:', mockAvailableSteps);
      });
    });

    it('logs trial initialization when editing', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      render(
        <TrialForm 
          trial={mockExistingTrial} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Initializing with trial:', mockExistingTrial);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles trial with mixed step data formats', async () => {
      const complexTrial = {
        _id: 'complex-trial',
        name: 'Complex Trial',
        steps: [
          {
            step: {
              _id: 'step1',
              name: 'Object Step',
              type: 'Rest',
              duration: 30
            },
            order: 0
          },
          {
            step: 'step2', // String ID reference
            order: 1
          }
        ]
      };
      
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      expect(() => {
        render(
          <TrialForm 
            trial={complexTrial} 
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel} 
          />
        );
      }).not.toThrow();
    });

    it('handles trial without steps array', async () => {
      const trialWithoutSteps = {
        _id: 'no-steps-trial',
        name: 'No Steps Trial'
        // steps is undefined
      };
      
      mockedAxios.get.mockResolvedValue({ data: mockAvailableSteps });
      
      expect(() => {
        render(
          <TrialForm 
            trial={trialWithoutSteps} 
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel} 
          />
        );
      }).not.toThrow();
    });

    it('handles empty available steps', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      
      render(<TrialForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('No steps available')).toBeInTheDocument();
      });
    });
  });
});