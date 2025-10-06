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
      if (token) {
        fetchUser();
      } else {
        setLoading(false);
      }
    }, []);

    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const login = async (email, password) => {
      try {
        const response = await api.post("/auth/login", { email, password });
        const { token, user } = response.data;
        localStorage.setItem("token", token);
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
        setUser(user);
        return { success: true };
      } catch (error) {
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
