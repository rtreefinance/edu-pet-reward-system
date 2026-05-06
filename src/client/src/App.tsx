import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { UserRole } from '@shared/types';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import HomeworkList from './pages/HomeworkList';
import TeacherHomework from './pages/TeacherHomework';
import CheckInCalendar from './pages/CheckInCalendar';
import PetShop from './pages/PetShop';
import PetDetail from './pages/PetDetail';
import ParentDashboard from './pages/ParentDashboard';
import MobileNav from './components/MobileNav';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="pet-body bg-gradient-to-br from-primary to-purple animate-float">
          <span className="text-4xl animate-bounce-in">🐾</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <span className="text-6xl mb-4">🚫</span>
        <h2 className="text-xl font-bold text-text-main mb-2">无权访问</h2>
        <p className="text-text-sub text-center">该页面仅限特定角色访问</p>
        <button onClick={() => window.history.back()} className="btn-primary mt-6">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {children}
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === UserRole.Student ? <Dashboard /> :
             user?.role === UserRole.Teacher ? <TeacherHomework /> :
             <ParentDashboard />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/homework"
        element={
          <ProtectedRoute roles={[UserRole.Student]}>
            <HomeworkList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={[UserRole.Teacher]}>
            <TeacherHomework />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute roles={[UserRole.Student]}>
            <CheckInCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectedRoute roles={[UserRole.Student]}>
            <PetShop />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pet"
        element={
          <ProtectedRoute roles={[UserRole.Student]}>
            <PetDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute roles={[UserRole.Parent]}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <MobileNav />
      </AuthProvider>
    </BrowserRouter>
  );
}
