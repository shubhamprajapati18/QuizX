import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [faculty, setFaculty] = useState(() => {
    const saved = localStorage.getItem('quizx_faculty_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quizx_faculty_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (token) {
        try {
          const res = await api.auth.getProfile();
          if (res.success && res.faculty) {
            setFaculty(res.faculty);
            localStorage.setItem('quizx_faculty_user', JSON.stringify(res.faculty));
          }
        } catch (err) {
          console.warn('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    }
    verifyToken();
  }, []);

  const login = async (credentials) => {
    const res = await api.auth.login(credentials);
    if (res.success && res.token) {
      setToken(res.token);
      setFaculty(res.faculty);
      localStorage.setItem('quizx_faculty_token', res.token);
      localStorage.setItem('quizx_faculty_user', JSON.stringify(res.faculty));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success && res.token) {
      setToken(res.token);
      setFaculty(res.faculty);
      localStorage.setItem('quizx_faculty_token', res.token);
      localStorage.setItem('quizx_faculty_user', JSON.stringify(res.faculty));
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setFaculty(null);
    localStorage.removeItem('quizx_faculty_token');
    localStorage.removeItem('quizx_faculty_user');
  };

  const updateFacultyProfile = (updatedFaculty) => {
    setFaculty(updatedFaculty);
    localStorage.setItem('quizx_faculty_user', JSON.stringify(updatedFaculty));
  };

  return (
    <AuthContext.Provider
      value={{
        faculty,
        token,
        isAuthenticated: !!token && !!faculty,
        loading,
        login,
        register,
        logout,
        updateFacultyProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
