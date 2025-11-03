import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // Or use router redirect if available
    }
    return Promise.reject(error);
  }
);

// Chat API functions
const chatApi = {
  // Send a message to the AI
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post("/chat/message", { message, sessionId });
    return response.data;
  },

  // Get chat history
  getChatHistory: async (category = null) => {
    const params = category ? { category } : {};
    const response = await api.get("/chat/history", { params });
    return response.data;
  },
};

// Export both the axios instance and the chat API functions
export { chatApi };
export default api;
