import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@shared/types';

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || location.pathname === '/login') return null;

  const isActive = (path: string) => location.pathname === path;

  const studentNav = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/homework', icon: '📚', label: '作业' },
    { path: '/checkin', icon: '✅', label: '签到' },
    { path: '/shop', icon: '🛍️', label: '商店' },
    { path: '/pet', icon: '🐾', label: '宠物' },
  ];

  const teacherNav = [
    { path: '/', icon: '📋', label: '管理' },
  ];

  const parentNav = [
    { path: '/', icon: '👀', label: '概览' },
  ];

  const items = user.role === UserRole.Student ? studentNav :
                user.role === UserRole.Teacher ? teacherNav : parentNav;

  return (
    <nav className="mobile-nav" style={{ maxWidth: '100vw' }}>
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
