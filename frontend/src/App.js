import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import NavigationBar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import PublicDashboard from './pages/PublicDashboard';
import IssueDetail from './pages/IssueDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ReportIssue from './pages/ReportIssue';
import { useAuth } from './context/AuthContext';

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  const hideNav =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/verify-email';

  return (
    <>
      {!hideNav && <NavigationBar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        <Route path="/issues" element={<PublicDashboard />} />
        <Route path="/issues/:id" element={<IssueDetail />} />

        <Route
          path="/dashboard"
          element={
            user
              ? user.role === 'admin'
                ? <Navigate to="/admin" />
                : <Dashboard />
              : <Login />
          }
        />

        <Route
          path="/report"
          element={
            user
              ? user.role === 'admin'
                ? <Navigate to="/admin" />
                : <ReportIssue />
              : <Login />
          }
        />

        <Route path="/profile" element={user ? <Profile /> : <Login />} />

        <Route
          path="/admin"
          element={
            user?.role === 'admin'
              ? <AdminDashboard />
              : <Login />
          }
        />
      </Routes>

      {!hideNav &&
  !(
    user?.role === 'admin' &&
    (
      location.pathname === '/' ||
      location.pathname === '/issues' ||
      location.pathname.startsWith('/issues/') ||
      location.pathname === '/admin'
    )
  ) &&
  <Footer />
}

      <ToastContainer position="top-right" theme="colored" />
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
