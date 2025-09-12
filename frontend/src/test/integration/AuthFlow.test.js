import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Simple mock components for integration testing
const Login = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };
    
    try {
      const response = await axios.post('/api/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input name="username" type="text" placeholder="Username" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}</p>
      <nav>
        <a href="/experiments">Experiments</a>
        <a href="/trials">Trials</a>
        <a href="/steps">Steps</a>
      </nav>
    </div>
  );
};

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.location.href = '';
  });

  it('completes successful login flow', async () => {
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'researcher'
    };

    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: mockUser
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for API call and localStorage operations
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123'
      });
    });

    // Wait a bit more for localStorage operations to complete
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });

    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
    expect(window.location.href).toBe('/dashboard');
  });

  it('handles login failure correctly', async () => {
    const mockError = {
      response: {
        status: 401,
        data: { message: 'Invalid credentials' }
      }
    };

    mockedAxios.post.mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'wronguser' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    // Check that no token is stored and redirect doesn't happen
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('');

    consoleSpy.mockRestore();
  });

  it('displays dashboard with user data after login', () => {
    // Simulate already logged in user
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'researcher'
    };

    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /experiments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trials/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /steps/i })).toBeInTheDocument();
  });

  it('handles empty user data gracefully', () => {
    // No user data in localStorage
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome,')).toBeInTheDocument(); // Empty username
    expect(screen.getByRole('link', { name: /experiments/i })).toBeInTheDocument();
  });
});