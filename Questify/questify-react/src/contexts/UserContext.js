import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user info when this component is mounted
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("activeUser");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Update the user in local storage, could be like when they change users or refresh
  const updateUser = (userData) => {
    try {
      if (userData) {
        localStorage.setItem("activeUser", JSON.stringify(userData));
        setUser(userData);
      } else {
        localStorage.removeItem("activeUser");
        setUser(null);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Get user data using their ID
  const fetchUserById = async (userId) => {
    if (!userId) return null;

    try {
      const response = await fetch(`https://questify.duckdns.org/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        updateUser(userData);
        return userData;
      } else {
        console.error("Failed to fetch user data");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // This just refreshes the user data
  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`https://questify.duckdns.org/api/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        updateUser(userData);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Sets the user to null when loggin out
  const logout = () => {
    updateUser(null);
  };

  // Adds fields to the user data if need be
  const updateUserFields = (fields) => {
    if (!user) return;
    const updatedUser = { ...user, ...fields };
    updateUser(updatedUser);
  };

  const value = {
    user,
    loading,
    updateUser,
    updateUserFields,
    fetchUserById,
    refreshUser,
    logout,
    isAuthenticated: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
