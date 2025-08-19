import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
      } catch {}
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
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const fetchUser = async () => {
    try {
      const demoUserJson = localStorage.getItem("demoUser");
      if (demoUserJson) {
        const parsedDemoUser = JSON.parse(demoUserJson);
        setUser(parsedDemoUser);
        return;
      }
      const response = await axios.get(
        "http://localhost:5000/api/users/profile"
      );
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );
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
      } catch {}
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
        }
      );
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(user);

      return { success: true };
    } catch (error) {
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
      } catch {}
      const token = "demo-token";
      localStorage.setItem("token", token);
      setAuthHeader(token);
      setUser(demoUser);
      return { success: true, message: "Registered (demo mode)" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("demoUser");
    localStorage.removeItem("demoCredentials");
    delete axios.defaults.headers.common["Authorization"];
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
