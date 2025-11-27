import React from 'react';
import { Navigate } from 'react-router-dom';

const UserProtectedRoute = ({ children }) => {
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        return JSON.parse(currentUser);
      }

      const sessionAuthUser = sessionStorage.getItem('auth_user');
      if (sessionAuthUser) {
        return JSON.parse(sessionAuthUser);
      }

      return null;

    } catch (error) {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default UserProtectedRoute;