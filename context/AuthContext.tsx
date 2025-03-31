<?xml version="1.0" encoding="UTF-8"?>
'use client'; // Mark this as a Client Component

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import type {
  User,
  LoginCredentials,
  SignupCredentials,
  ApiResponse,
} from '../lib/types';

// Define the shape of the authentication state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Loading state for login, signup, initial check
  error: string | null; // Stores error messages from API calls
}

// Define the shape of the context value, including state and actions
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (details: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and actions to the application.
 * Manages user session, loading states, errors, and provides functions
 * for login, signup, and logout operations by interacting with backend API endpoints.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially for auth check
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Checks the initial authentication state by calling the profile endpoint.
   * This function is typically called once when the application loads.
   */
  const checkAuthState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<ApiResponse<{ user: User }>>(
        '/api/auth/profile'
      );
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
      } else {
        // Handle cases where API returns success:false or missing data
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      // Expected errors (like 401 Unauthorized) mean the user is not logged in.
      // Only log unexpected errors.
      const axiosError = err as AxiosError<ApiResponse>;
      if (axiosError.response?.status !== 401) {
        console.error('Error checking auth state:', axiosError.message);
      }
      setUser(null);
      setIsAuthenticated(false);
      // No need to set error state for failed initial auth check
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies, runs once on mount

  // Effect to check authentication state on initial mount
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  /**
   * Handles user login by sending credentials to the backend API.
   * On success, fetches the user profile to update state and redirects to the dashboard.
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Attempt Login - Backend sets HttpOnly cookie on success
        const loginResponse = await axios.post<ApiResponse<{ user: User }>>(
          '/api/auth',
          {
            action: 'login',
            ...credentials,
          }
        );

        if (!loginResponse.data.success) {
          // Throw error if backend indicates login failure
          throw new Error(
            loginResponse.data.message || 'Login failed from API'
          );
        }

        // Step 2: Fetch Profile - Verify session and get user data based on new cookie
        // Use checkAuthState logic directly here
        await checkAuthState(); // This will set user, isAuthenticated, and isLoading=false

        // Redirect only after successful state update from checkAuthState
        if (isAuthenticated && user) { // Check state updated by checkAuthState
          router.push('/dashboard');
        } else {
           // This case should ideally not happen if checkAuthState worked after successful login
           console.error("Login succeeded but profile fetch failed to update state.");
           setError("Login successful, but failed to load user data.");
           // Fallback state clearing
           setUser(null);
           setIsAuthenticated(false);
        }

      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        const errorMessage =
          axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
        console.error('Login Error:', errorMessage);
        setError(errorMessage);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false); // Ensure loading is stopped on error
      }
      // `finally` block for loading state is handled within checkAuthState
    },
    [router, checkAuthState, user, isAuthenticated] // Include state check dependencies
  );

  /**
   * Handles user signup by sending registration details to the backend API.
   * On success, redirects the user to the login page.
   */
  const signup = useCallback(
    async (details: SignupCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.post<ApiResponse>('/api/auth', {
          action: 'signup',
          ...details,
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || 'Signup failed from API'
          );
        }

        // Signup successful, redirect to login page as per requirements
        router.push('/login');
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        const errorMessage =
          axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : 'Signup failed. Please try again.');
        console.error('Signup Error:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Handles user logout by calling the backend logout endpoint, clearing client state,
   * and redirecting to the login page.
   */
  const logout = useCallback(async () => {
    setIsLoading(true); // Indicate loading starts
    setError(null);
    try {
      // Ask the backend to clear the HttpOnly cookie
      await axios.post<ApiResponse>('/api/auth/logout');
      // Note: We proceed with client-side cleanup even if the API call fails,
      // as the primary goal is to clear the client session.
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      console.error(
        'Logout API Error:',
        axiosError.response?.data?.message || axiosError.message
      );
      // We still proceed to clear client state and redirect.
    } finally {
      // Clear client-side state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      // Redirect to login page
      router.push('/login');
      setIsLoading(false); // Ensure loading stops after state clear & redirect attempt
    }
  }, [router]);

  // Provide the authentication state and actions to consuming components
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to consume the AuthContext.
 * Ensures the hook is used within an AuthProvider.
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};