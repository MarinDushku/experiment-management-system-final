import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../contexts/authContext';

// Mock the auth context
jest.mock('../../contexts/authContext');

// Test wrapper with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title', () => {
    useAuth.mockReturnValue({
      user: { username: 'testuser', role: 'user' }
    });

    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  describe('User Role: Standard User', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'johndoe', role: 'user' }
      });
    });

    it('displays welcome message for user', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Welcome, johndoe')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('You have standard user access.')).toBeInTheDocument();
    });

    it('does not show admin panel link for standard user', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.queryByText('Go to Admin Panel')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin Functions')).not.toBeInTheDocument();
    });

    it('does not show researcher actions for standard user', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.queryByText('Go to Experiments')).not.toBeInTheDocument();
      expect(screen.queryByText('Go to Trials')).not.toBeInTheDocument();
      expect(screen.queryByText('Go to Steps')).not.toBeInTheDocument();
    });
  });

  describe('User Role: Researcher', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'researcher', role: 'researcher' }
      });
    });

    it('displays welcome message for researcher', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Welcome, researcher')).toBeInTheDocument();
      expect(screen.getByText('researcher')).toBeInTheDocument();
      expect(screen.getByText('You can create and manage experiments, trials, and steps.')).toBeInTheDocument();
    });

    it('shows researcher action cards', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Experiments')).toBeInTheDocument();
      expect(screen.getByText('Create and manage research experiments')).toBeInTheDocument();
      expect(screen.getByText('Go to Experiments')).toBeInTheDocument();
      
      expect(screen.getByText('Trials')).toBeInTheDocument();
      expect(screen.getByText('Create and manage experiment trials')).toBeInTheDocument();
      expect(screen.getByText('Go to Trials')).toBeInTheDocument();
      
      expect(screen.getByText('Steps')).toBeInTheDocument();
      expect(screen.getByText('Create and manage trial steps')).toBeInTheDocument();
      expect(screen.getByText('Go to Steps')).toBeInTheDocument();
    });

    it('does not show admin panel for researcher', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.queryByText('Go to Admin Panel')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin Functions')).not.toBeInTheDocument();
    });

    it('has correct navigation links for researcher', () => {
      renderWithRouter(<Dashboard />);
      
      const experimentsLink = screen.getByRole('link', { name: /go to experiments/i });
      expect(experimentsLink).toHaveAttribute('href', '/experiments');
      
      const trialsLink = screen.getByRole('link', { name: /go to trials/i });
      expect(trialsLink).toHaveAttribute('href', '/trials');
      
      const stepsLink = screen.getByRole('link', { name: /go to steps/i });
      expect(stepsLink).toHaveAttribute('href', '/steps');
    });
  });

  describe('User Role: Admin', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'admin', role: 'admin' }
      });
    });

    it('displays welcome message for admin', () => {
      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Welcome, admin')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('You have full administrative access.')).toBeInTheDocument();
    });

    it('shows all action cards including admin panel', () => {
      renderWithRouter(<Dashboard />);
      
      // Admin card
      expect(screen.getByText('Admin Functions')).toBeInTheDocument();
      expect(screen.getByText('Manage users and system settings')).toBeInTheDocument();
      expect(screen.getByText('Go to Admin Panel')).toBeInTheDocument();
      
      // Researcher cards (admin has all researcher permissions)
      expect(screen.getByText('Experiments')).toBeInTheDocument();
      expect(screen.getByText('Trials')).toBeInTheDocument();
      expect(screen.getByText('Steps')).toBeInTheDocument();
    });

    it('has correct navigation links for admin', () => {
      renderWithRouter(<Dashboard />);
      
      const adminLink = screen.getByRole('link', { name: /go to admin panel/i });
      expect(adminLink).toHaveAttribute('href', '/admin');
      
      const experimentsLink = screen.getByRole('link', { name: /go to experiments/i });
      expect(experimentsLink).toHaveAttribute('href', '/experiments');
      
      const trialsLink = screen.getByRole('link', { name: /go to trials/i });
      expect(trialsLink).toHaveAttribute('href', '/trials');
      
      const stepsLink = screen.getByRole('link', { name: /go to steps/i });
      expect(stepsLink).toHaveAttribute('href', '/steps');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing username gracefully', () => {
      useAuth.mockReturnValue({
        user: { role: 'user' }
      });

      renderWithRouter(<Dashboard />);
      
      // Should still render without crashing
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome,')).toBeInTheDocument(); // Empty username
    });

    it('handles null user gracefully', () => {
      useAuth.mockReturnValue({
        user: null
      });

      renderWithRouter(<Dashboard />);
      
      // Should still render the basic dashboard structure
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles undefined user gracefully', () => {
      useAuth.mockReturnValue({
        user: undefined
      });

      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles unknown user role gracefully', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', role: 'unknown' }
      });

      renderWithRouter(<Dashboard />);
      
      expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
      expect(screen.getByText('unknown')).toBeInTheDocument();
      
      // Should not show any role-specific content
      expect(screen.queryByText('Go to Admin Panel')).not.toBeInTheDocument();
      expect(screen.queryByText('Go to Experiments')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes to main elements', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', role: 'admin' }
      });

      const { container } = renderWithRouter(<Dashboard />);
      
      expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
      expect(container.querySelector('.dashboard-title')).toBeInTheDocument();
      expect(container.querySelector('.dashboard-layout')).toBeInTheDocument();
      expect(container.querySelector('.welcome-section')).toBeInTheDocument();
      expect(container.querySelector('.actions-section')).toBeInTheDocument();
    });

    it('applies correct classes to role badge', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', role: 'researcher' }
      });

      const { container } = renderWithRouter(<Dashboard />);
      
      expect(container.querySelector('.role-badge')).toBeInTheDocument();
    });

    it('applies correct classes to action cards', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', role: 'admin' }
      });

      const { container } = renderWithRouter(<Dashboard />);
      
      expect(container.querySelector('.admin-card')).toBeInTheDocument();
      expect(container.querySelector('.action-card')).toBeInTheDocument();
      expect(container.querySelector('.admin-button')).toBeInTheDocument();
    });
  });
});