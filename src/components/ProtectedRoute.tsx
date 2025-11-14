import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthWrapper from './AuthWrapper';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Let AuthWrapper handle loading states to avoid duplication
  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
