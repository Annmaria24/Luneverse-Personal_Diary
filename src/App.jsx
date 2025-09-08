import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ConditionalPregnancyRoute from "./components/ConditionalPregnancyRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import SignUpPage from "./pages/SignupPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import VerificationSuccessPage from "./pages/VerificationSuccessPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DiaryPage from "./pages/DiaryPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import CycleTrackerPage from "./pages/CycleTrackerPage";
import PregnancyTrackerPage from "./pages/PregnancyTrackerPage";
import SettingsPage from "./pages/SettingsPage";
import Insights from "./pages/Insights";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/verify-success" element={<VerificationSuccessPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diary"
            element={
              <ProtectedRoute>
                <DiaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mood-tracker"
            element={
              <ProtectedRoute>
                <MoodTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cycle-tracker"
            element={
              <ProtectedRoute>
                <CycleTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pregnancy-tracker"
            element={<ConditionalPregnancyRoute />}
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />


        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
