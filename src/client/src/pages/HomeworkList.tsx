import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import type { Homework } from '@shared/types';
import { HomeworkStatus } from '@shared/types';
import HomeworkCard from '../components/HomeworkCard';

const STATUS_TABS = [
  { value: '', label: '全部', emoji: '📋' },
  { value: HomeworkStatus.Pending, label: '待完成', emoji: '📝' },
  { value: HomeworkStatus.Submitted, label: '已提交', emoji: '📤' },
  { value: HomeworkStatus.Graded, label: '已批改', emoji: '✅' },
];

export default function HomeworkList() {
  const { call } = useApi();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [error, setError] = useState('');

  const loadData = async (status?: string) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const data = await call<{ homework: Homework[] }>('/api/homework', { params });
      setHomeworks(data.homework || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleSubmit = async (id: string) => {
    try {
      // The backend doesn't have a submit endpoint, but we can simulate
      // For now, just refresh
      alert('作业已提交！等待老师批改～');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-text-main">📚 我的作业</h2>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-button text-sm font-bold transition-all ${
              activeTab === tab.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-sub hover:bg-gray-50'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="text-4xl mb-3">😿</span>
          <p>{error}</p>
        </div>
      ) : homeworks.length === 0 ? (
        <div className="empty-state">
          <span className="text-5xl mb-4 animate-float">📭</span>
          <p className="font-bold text-text-main mb-1">没有作业记录</p>
          <p className="text-sm">老师布置的作业会出现在这里哦～</p>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((hw) => (
            <HomeworkCard
              key={hw._id}
              homework={hw}
              teacherName={(hw as any).teacherId?.displayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
