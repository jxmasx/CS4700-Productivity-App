import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function ProtectedRoute() {
  const { user, loading } = useUser();

  // While authenticating just return nothing
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Use child routes if authenticated (like dashboard, guildhall, etc.)
  return <Outlet />;
}
