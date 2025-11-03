import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const setAuthHeader = (token) => {
    // Ensure axios instance has the Authorization header for immediate requests.
    // The request interceptor also reads from localStorage, but setting the
    // default header here makes the token effective immediately after login/register
    // without waiting for the next request cycle.
    try {
      if (token) {
        // store token if not already stored by caller
        if (localStorage.getItem("token") !== token) {
          localStorage.setItem("token", token);
        }
        // set default header on axios instance
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        // remove header when token is null/undefined
        if (api.defaults.headers && api.defaults.headers.common) {
          delete api.defaults.headers.common["Authorization"];
        }
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.warn("Unable to set auth header:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthHeader(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Error registering user:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    // Clear stored token and axios header
    setAuthHeader(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
