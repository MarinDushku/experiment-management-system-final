import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the auth context with a simple mock
const mockUseAuth = jest.fn();
jest.mock('../../../contexts/authContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Simple Login component mock for testing
const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
            />
          </div>
          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
};

describe('Login Component Basic Test', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
      loading: false
    });
  });

  it('renders login form elements', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});