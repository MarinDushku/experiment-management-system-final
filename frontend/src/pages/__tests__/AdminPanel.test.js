import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminPanel from '../AdminPanel';
import api from '../../utils/api';

// Mock the API utility
jest.mock('../../utils/api');
const mockedApi = api;

// Mock the ExperimentResults component
jest.mock('../../components/admin/ExperimentResults', () => {
  return function MockExperimentResults() {
    return <div data-testid="experiment-results">Experiment Results Component</div>;
  };
});

// Mock window.confirm
global.confirm = jest.fn();

describe('AdminPanel Component', () => {
  const mockUsers = [
    {
      _id: '1',
      username: 'user1',
      role: 'user',
      createdAt: '2023-01-15T10:00:00Z'
    },
    {
      _id: '2',
      username: 'researcher1',
      role: 'researcher',
      createdAt: '2023-02-10T15:30:00Z'
    },
    {
      _id: '3',
      username: 'md',
      role: 'admin',
      createdAt: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(false); // Default to cancel for safety
  });

  describe('Component Loading', () => {
    it('displays loading state initially', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AdminPanel />);
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('renders admin panel title', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    it('renders user table with correct headers', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Created At')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('displays user data correctly', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('researcher1')).toBeInTheDocument();
        expect(screen.getByText('md')).toBeInTheDocument();
      });
      
      // Check formatted dates
      expect(screen.getByText('1/15/2023')).toBeInTheDocument();
      expect(screen.getByText('2/10/2023')).toBeInTheDocument();
      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });

    it('displays role dropdowns with correct values', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox');
        expect(roleSelects).toHaveLength(3);
        
        expect(roleSelects[0]).toHaveValue('user');
        expect(roleSelects[1]).toHaveValue('researcher');
        expect(roleSelects[2]).toHaveValue('admin');
      });
    });

    it('shows delete buttons for all users', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe('Empty State', () => {
    it('displays no users message when list is empty', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Network Error';
      mockedApi.get.mockRejectedValue(new Error(errorMessage));
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(`Failed to load users: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('handles API error with response data', async () => {
      const apiError = {
        response: {
          data: { message: 'Unauthorized access' }
        }
      };
      mockedApi.get.mockRejectedValue(apiError);
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load users: Unauthorized access')).toBeInTheDocument();
      });
    });
  });

  describe('Role Change Functionality', () => {
    it('calls API to change user role', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.put.mockResolvedValue({});
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox');
        fireEvent.change(roleSelects[0], { target: { value: 'researcher' } });
      });
      
      expect(mockedApi.put).toHaveBeenCalledWith('/users/1/role', { role: 'researcher' });
    });

    it('updates local state after successful role change', async () => {
      const updatedUsers = [...mockUsers];
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.put.mockResolvedValue({});
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox');
        fireEvent.change(roleSelects[0], { target: { value: 'researcher' } });
      });
      
      await waitFor(() => {
        const updatedSelect = screen.getAllByRole('combobox')[0];
        expect(updatedSelect).toHaveValue('researcher');
      });
    });

    it('displays error message when role change fails', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.put.mockRejectedValue(new Error('Update failed'));
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox');
        fireEvent.change(roleSelects[0], { target: { value: 'researcher' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to update user role. Please try again.')).toBeInTheDocument();
      });
    });

    it('prevents changing admin role for protected user', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const roleSelects = screen.getAllByRole('combobox');
        // The admin user 'md' should have a disabled select
        expect(roleSelects[2]).toBeDisabled();
      });
    });
  });

  describe('User Deletion Functionality', () => {
    it('shows confirmation dialog when delete button is clicked', async () => {
      global.confirm.mockReturnValue(false);
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
    });

    it('calls delete API when user confirms deletion', async () => {
      global.confirm.mockReturnValue(true);
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.delete.mockResolvedValue({});
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockedApi.delete).toHaveBeenCalledWith('/users/1');
      });
    });

    it('updates local state after successful deletion', async () => {
      global.confirm.mockReturnValue(true);
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.delete.mockResolvedValue({});
      
      render(<AdminPanel />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

    it('does not delete when user cancels confirmation', async () => {
      global.confirm.mockReturnValue(false);
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(mockedApi.delete).not.toHaveBeenCalled();
    });

    it('displays error message when deletion fails', async () => {
      global.confirm.mockReturnValue(true);
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.delete.mockRejectedValue(new Error('Delete failed'));
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to delete user. Please try again.')).toBeInTheDocument();
      });
    });

    it('prevents deleting protected admin user', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        // The admin user 'md' should have a disabled delete button
        expect(deleteButtons[2]).toBeDisabled();
      });
    });
  });

  describe('ExperimentResults Integration', () => {
    it('renders ExperimentResults component', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByTestId('experiment-results')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('makes correct API call to fetch users', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/users');
      });
    });

    it('handles multiple API calls correctly', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      mockedApi.put.mockResolvedValue({});
      mockedApi.delete.mockResolvedValue({});
      global.confirm.mockReturnValue(true);
      
      render(<AdminPanel />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
      
      // Change role
      const roleSelects = screen.getAllByRole('combobox');
      fireEvent.change(roleSelects[0], { target: { value: 'researcher' } });
      
      // Delete user
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]);
      
      await waitFor(() => {
        expect(mockedApi.put).toHaveBeenCalledWith('/users/1/role', { role: 'researcher' });
        expect(mockedApi.delete).toHaveBeenCalledWith('/users/2');
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

    it('logs user fetch operations', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });
      
      render(<AdminPanel />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Fetching users...');
        expect(consoleSpy).toHaveBeenCalledWith('Users fetched:', mockUsers);
      });
    });
  });
});