import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock auth context
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../../contexts/authContext', () => ({
  useAuth: () => mockUseAuth()
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: mockLogout
      });
    });

    it('renders guest navigation correctly', () => {
      renderNavbar();
      
      expect(screen.getByRole('heading', { name: /research experiment management/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /research experiment management/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      
      // Should not show authenticated links
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });

    it('has correct href attributes for guest links', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
      expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
    });
  });

  describe('Admin Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'admin', username: 'adminuser' },
        logout: mockLogout
      });
    });

    it('renders admin navigation correctly', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /research experiment management/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /admin panel/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /experiments/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /trials/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /steps/i })).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      
      // Should not show guest links
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });

    it('has correct href attributes for admin links', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /admin panel/i })).toHaveAttribute('href', '/admin');
      expect(screen.getByRole('link', { name: /experiments/i })).toHaveAttribute('href', '/experiments');
      expect(screen.getByRole('link', { name: /trials/i })).toHaveAttribute('href', '/trials');
      expect(screen.getByRole('link', { name: /steps/i })).toHaveAttribute('href', '/steps');
    });
  });

  describe('Researcher Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'researcher', username: 'researcher' },
        logout: mockLogout
      });
    });

    it('renders researcher navigation correctly', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /research experiment management/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /experiments/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /trials/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /steps/i })).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      
      // Should not show admin panel or guest links
      expect(screen.queryByRole('link', { name: /admin panel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });

    it('has correct href attributes for researcher links', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /experiments/i })).toHaveAttribute('href', '/experiments');
      expect(screen.getByRole('link', { name: /trials/i })).toHaveAttribute('href', '/trials');
      expect(screen.getByRole('link', { name: /steps/i })).toHaveAttribute('href', '/steps');
    });
  });

  describe('Regular User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'user', username: 'regularuser' },
        logout: mockLogout
      });
    });

    it('renders user navigation correctly', () => {
      renderNavbar();
      
      expect(screen.getByRole('link', { name: /research experiment management/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      
      // Should not show admin/researcher specific links
      expect(screen.queryByRole('link', { name: /admin panel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /experiments/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /trials/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /steps/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'researcher', username: 'researcher' },
        logout: mockLogout
      });
    });

    it('handles logout click correctly', () => {
      renderNavbar();
      
      const logoutLink = screen.getByText(/logout/i);
      fireEvent.click(logoutLink);
      
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('logout link has correct attributes', () => {
      renderNavbar();
      
      const logoutLink = screen.getByText(/logout/i);
      expect(logoutLink).toHaveAttribute('href', '#!');
    });
  });

  describe('Edge Cases', () => {
    it('handles user with unknown role', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'unknown', username: 'unknownuser' },
        logout: mockLogout
      });

      renderNavbar();
      
      // Should default to user navigation
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /admin panel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /experiments/i })).not.toBeInTheDocument();
    });

    it('handles authenticated user with null user object', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: null,
        logout: mockLogout
      });

      renderNavbar();
      
      // Should default to user navigation
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });
});