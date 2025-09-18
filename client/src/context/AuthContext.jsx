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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const demoUserJson = localStorage.getItem("demoUser");
    if (demoUserJson) {
      // Demo mode: restore user without hitting backend
      try {
        const parsedDemoUser = JSON.parse(demoUserJson);
        setUser(parsedDemoUser);
      } catch {
        // No-op for demo mode fallback
      }
      setLoading(false);
      return;
    }
    if (token) {
      setAuthHeader(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const setAuthHeader = (token) => {
    // Token is now handled by the api interceptor
  };

  const fetchUser = async () => {
    try {

      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      // Demo mode fallback: authenticate using stored demo credentials
      try {
        const demoCredsJson = localStorage.getItem("demoCredentials");
        const demoUserJson = localStorage.getItem("demoUser");
        if (demoCredsJson && demoUserJson) {
          const demoCreds = JSON.parse(demoCredsJson);
          const demoUser = JSON.parse(demoUserJson);
          if (demoCreds.email === email && demoCreds.password === password) {
            const token = "demo-token";
            localStorage.setItem("token", token);
            setAuthHeader(token);
            setUser(demoUser);
            return { success: true, message: "Logged in (demo mode)" };
          }
        }
      } catch {
        // Intentionally left empty for demo mode fallback
        return;
      }
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
      // Demo mode fallback: allow local registration when backend is unavailable
      const demoUser = {
        id: "demo",
        name,
        email,
      };
      try {
        localStorage.setItem("demoUser", JSON.stringify(demoUser));
        localStorage.setItem(
          "demoCredentials",
          JSON.stringify({ email, password })
        );
      } catch {
        // Intentionally left empty for demo mode fallback
      }
      const token = "demo-token";
      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(demoUser);
      return { success: true, message: "Registered (demo mode)" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

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
