import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';
import Register from './Register';

const AuthWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const handleShowRegister = () => setShowRegister(true);
    const handleShowLogin = () => setShowRegister(false);

    window.addEventListener('showRegister', handleShowRegister);
    window.addEventListener('showLogin', handleShowLogin);

    return () => {
      window.removeEventListener('showRegister', handleShowRegister);
      window.removeEventListener('showLogin', handleShowLogin);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will be handled by the parent component
  }

  return showRegister ? <Register /> : <Login />;
};

export default AuthWrapper;
