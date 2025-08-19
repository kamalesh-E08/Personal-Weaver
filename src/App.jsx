
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import LandingPage from "./components/LandingPage/LandingPage";
import Dashboard from "./components/Dashboard/Dashboard";
import Chat from "./components/Chat/Chat";
import Planner from "./components/Planner/Planner";
import Tasks from "./components/Tasks/Tasks";
import History from "./components/History/History";
import Profile from "./components/Profile/Profile";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Personal Weaver...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <LandingPage />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/" />}
      />
      <Route path="/chat" element={user ? <Chat /> : <Navigate to="/" />} />
      <Route
        path="/planner"
        element={user ? <Planner /> : <Navigate to="/" />}
      />
      <Route path="/tasks" element={user ? <Tasks /> : <Navigate to="/" />} />
      <Route
        path="/history"
        element={user ? <History /> : <Navigate to="/" />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

