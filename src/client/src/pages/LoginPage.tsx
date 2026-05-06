import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@shared/types';
import type { User } from '@shared/types';

type Tab = 'login' | 'register';

const ROLE_CONFIG: { role: UserRole; label: string; emoji: string; color: string }[] = [
  { role: UserRole.Student, label: '学生', emoji: '🎒', color: 'bg-primary' },
  { role: UserRole.Teacher, label: '老师', emoji: '👩‍🏫', color: 'bg-secondary' },
  { role: UserRole.Parent, label: '家长', emoji: '👨‍👩‍👧', color: 'bg-purple' },
];

export default function LoginPage() {
  const { login: doLogin } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: any = { username, password, role, displayName };
      if (tab === 'register' && role === UserRole.Teacher) {
        body.subject = subject;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');

      doLogin(data.token, data.user as User);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-pink-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center animate-bounce-in">
        <div className="pet-body bg-gradient-to-br from-primary to-purple mx-auto mb-4 shadow-lg">
          <span className="text-5xl">🐾</span>
        </div>
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple">
          宠物学习激励系统
        </h1>
        <p className="text-text-sub mt-1 text-sm">每天进步一点点，宠物陪你成长！</p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md p-6">
        {/* Tab Switch */}
        <div className="flex mb-6 bg-gray-100 rounded-button p-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-button font-bold text-sm transition-all ${
              tab === 'login' ? 'bg-white shadow text-primary' : 'text-text-sub'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 rounded-button font-bold text-sm transition-all ${
              tab === 'register' ? 'bg-white shadow text-primary' : 'text-text-sub'
            }`}
          >
            注册
          </button>
        </div>

        {/* Role Selector */}
        <div className="flex justify-center gap-2 mb-5">
          {ROLE_CONFIG.map((r) => (
            <button
              key={r.role}
              onClick={() => setRole(r.role)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-button text-sm font-bold transition-all ${
                role === r.role
                  ? `${r.color} text-white shadow-md scale-105`
                  : 'bg-gray-100 text-text-sub hover:bg-gray-200'
              }`}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input-field"
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {tab === 'register' && (
            <>
              <input
                className="input-field"
                type="text"
                placeholder="显示名称（如：小明）"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              {role === UserRole.Teacher && (
                <input
                  className="input-field"
                  type="text"
                  placeholder="教授科目（如：数学）"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-button px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin">🐾</span> 处理中...
              </span>
            ) : tab === 'login' ? (
              '🚀 进入系统'
            ) : (
              '✨ 创建账号'
            )}
          </button>
        </form>

        {tab === 'login' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-button text-xs text-text-sub">
            <p className="font-bold mb-1">🔑 测试账号（密码: password123）</p>
            <p>学生: student1 / student2</p>
            <p>老师: teacher1</p>
            <p>家长: parent1</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-text-sub">🐾 好好学习，你的宠物在等你！</p>
    </div>
  );
}
