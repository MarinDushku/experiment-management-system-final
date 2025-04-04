import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          
          // Set axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          dispatch({
            type: 'USER_LOADED',
            payload: user
          });
        } catch (err) {
          console.error('Error parsing user from localStorage', err);
          dispatch({
            type: 'AUTH_ERROR',
            payload: 'Session error. Please login again.'
          });
        }
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: null
        });
      }
    };
    
    loadUser();
  }, []);

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      
      // Set axios default headers immediately
      if (res.data && res.data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      
      return res.data.user;
    } catch (err) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.response?.data?.message || 'Login failed'
      });
      throw err;
    }
  };

  // Logout
  const logout = () => {
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        login,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);