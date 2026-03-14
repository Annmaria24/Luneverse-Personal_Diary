import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SiteNameProvider } from "./context/SiteNameContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ConditionalPregnancyRoute from "./components/ConditionalPregnancyRoute";
import AdminRoute from "./components/AdminRoute";
import ModuleGuard from "./components/ModuleGuard";
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
import MyJournal from "./pages/MyJournal";
import MyCycle from "./pages/MyCycle";
import SettingsPage from "./pages/SettingsPage";
import RelaxMode from "./pages/RelaxMode";
import RelaxBreathe from "./pages/RelaxBreathe";
import RelaxSound from "./pages/RelaxSound";
import RelaxQuotes from "./pages/RelaxQuotes";
import RelaxMeditations from "./pages/RelaxMeditations";
import RelaxVisuals from "./pages/RelaxVisuals";
import InsightsPage from "./pages/InsightsPage";
import EmotionalWellness from "./pages/EmotionalWellness";
import AdminDashboard from "./pages/admin/AdminDashboardFixed";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeedback from "./pages/admin/AdminFeedbackSimple";
import AdminSettings from "./pages/admin/AdminSettings";
import RelaxFlow from "./pages/RelaxFlow";
import Reflect from "./pages/Reflect";
import RelaxAffirmations from "./pages/RelaxAffirmations";

function App() {
  return (
    <SiteNameProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/feedback"
                element={
                  <AdminRoute>
                    <AdminFeedback />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                }
              />
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
                path="/emotional"
                element={
                  <ProtectedRoute>
                    <EmotionalWellness />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diary"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="journal">
                      <DiaryPage />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-journal"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="journal">
                      <MyJournal />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mood-tracker"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="moodTracker">
                      <MoodTrackerPage />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-cycle"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="cycleTracker">
                      <MyCycle />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
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
                path="/relax"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxMode />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <ProtectedRoute>
                    <InsightsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/breathe"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxBreathe />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/sound"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxSound />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/meditations"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxMeditations />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/quotes"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxQuotes />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/visuals"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxVisuals />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/flow"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxFlow />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/reflect"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <Reflect />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relax/affirmations"
                element={
                  <ProtectedRoute>
                    <ModuleGuard requiredModule="relaxMode">
                      <RelaxAffirmations />
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </SiteNameProvider>
  );
}

export default App;
