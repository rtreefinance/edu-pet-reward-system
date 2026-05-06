import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { ParentUser, Homework, CheckIn, Pet } from '@shared/types';
import { HomeworkStatus } from '@shared/types';

interface ChildSummary {
  childId: string;
  name: string;
  avatarUrl: string;
  homework: Homework[];
  lastCheckIn: string | null;
  pet: Pet | null;
  expanded: boolean;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { call } = useApi();
  const parent = user as ParentUser;

  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!parent?.childrenIds?.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summaries = await Promise.all(
        parent.childrenIds.map(async (childId) => {
          const summary: ChildSummary = {
            childId,
            name: '加载中...',
            avatarUrl: '',
            homework: [],
            lastCheckIn: null,
            pet: null,
            expanded: false,
          };
          try {
            const [hwRes, checkinRes] = await Promise.all([
              call<{ homework: Homework[] }>(`/api/homework/child/${childId}`).catch(() => ({ homework: [] })),
              call<{ checkins: CheckIn[] }>(`/api/checkin/child/${childId}`).catch(() => ({ checkins: [] })),
            ]);
            summary.homework = hwRes.homework || [];
            if (checkinRes.checkins && checkinRes.checkins.length > 0) {
              summary.lastCheckIn = checkinRes.checkins[checkinRes.checkins.length - 1].date;
            }
          } catch {
            // leave defaults
          }
          return summary;
        })
      );
      setChildren(summaries);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [parent, call]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = async (idx: number) => {
    const child = children[idx];
    if (child.expanded) {
      setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, expanded: false } : c)));
      return;
    }
    if (!child.pet && child.name === '加载中...') {
      try {
        const [petRes, userRes] = await Promise.all([
          call<{ pet: Pet; hasPet: boolean }>(`/api/pet/child/${child.childId}`).catch(() => ({ pet: null, hasPet: false })),
          call<{ user: { displayName: string; avatarUrl: string } }>(`/api/user/${child.childId}`).catch(() => null),
        ]);
        setChildren((prev) => prev.map((c, i) => i === idx ? {
          ...c, expanded: true,
          pet: petRes?.hasPet ? petRes.pet : null,
          name: userRes?.user?.displayName || c.name,
          avatarUrl: userRes?.user?.avatarUrl || '',
        } : c));
      } catch {
        setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, expanded: true } : c)));
      }
    } else {
      setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, expanded: true } : c)));
    }
  };

  if (!parent) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="card px-5 py-4">
        <h1 className="text-lg font-extrabold text-text-main">👀 家长面板</h1>
        <p className="text-xs text-text-sub mt-0.5">查看孩子的学习与宠物状态（只读）</p>
      </div>
      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: parent.childrenIds?.length || 2 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton w-24 h-4 mb-2" />
                  <div className="skeleton w-40 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Error */}
      {error && !loading && (
        <div className="empty-state">
          <span className="text-4xl mb-3">😿</span>
          <p className="font-bold text-text-main mb-1">加载失败</p>
          <p className="text-sm text-text-sub mb-4">{error}</p>
          <button onClick={loadData} className="btn-secondary text-sm">
            重新加载
          </button>
        </div>
      )}
      {/* Empty */}
      {!loading && !error && children.length === 0 && (
        <div className="empty-state">
          <span className="text-4xl mb-3">👨‍👩‍👧</span>
          <p className="font-bold text-text-main mb-1">还没有绑定孩子</p>
          <p className="text-sm text-text-sub">请联系老师绑定孩子账号</p>
        </div>
      )}
      {/* Children List */}
      {!loading &&
        !error &&
        children.map((child, idx) => {
          const pendingCount = child.homework.filter(
            (h) => h.status === HomeworkStatus.Pending || h.status === HomeworkStatus.Submitted
          ).length;
          const gradedList = child.homework.filter((h) => h.status === HomeworkStatus.Graded);
          const avgScore = gradedList.length > 0
            ? Math.round(gradedList.reduce((s, h) => s + h.score, 0) / gradedList.length) : null;

          return (
            <div key={child.childId} className="card p-4">
              {/* Child Summary Row */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => toggleExpand(idx)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-bold text-sm">
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    child.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-main text-sm truncate">{child.name}</p>
                  <div className="flex items-center gap-2 text-xs text-text-sub mt-0.5">
                    {avgScore !== null && (
                      <span className="badge-blue">均分 {avgScore}</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="badge-yellow">{pendingCount} 待批</span>
                    )}
                    {child.lastCheckIn && (
                      <span>最后签到: {child.lastCheckIn}</span>
                    )}
                  </div>
                </div>
                <span className="text-text-sub text-sm transition-transform duration-200"
                  style={{ transform: child.expanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
              </div>

              {/* Expanded Detail */}
              {child.expanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-slide-up">
                  <div>
                    <h3 className="text-xs font-bold text-text-sub mb-2">📚 作业概况</h3>
                    {child.homework.length === 0 ? (
                      <p className="text-xs text-text-sub">暂无作业记录</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-text-main">{child.homework.length}</p>
                          <p className="text-xs text-text-sub">总数</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-accent">{pendingCount}</p>
                          <p className="text-xs text-text-sub">待批</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-green">{gradedList.length}</p>
                          <p className="text-xs text-text-sub">已批</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Recent Homework */}
                  {child.homework.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-text-sub mb-2">📝 最近作业</h3>
                      <div className="space-y-1.5">
                        {child.homework.slice(0, 5).map((hw) => (
                          <div key={hw._id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-text-main truncate flex-1 mr-2">{hw.title}</span>
                            {hw.status === HomeworkStatus.Graded
                              ? <span className={`font-bold ${hw.score >= 90 ? 'text-green' : hw.score >= 60 ? 'text-accent' : 'text-red-400'}`}>{hw.score}/{hw.maxScore}</span>
                              : <span className="text-text-sub">{hw.status === HomeworkStatus.Submitted ? '待批阅' : '未提交'}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Pet Status */}
                  <div>
                    <h3 className="text-xs font-bold text-text-sub mb-2">🐾 宠物状态</h3>
                    {child.pet ? (
                      <div className="bg-pink-50 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl">{child.pet.level >= 50 ? '✨' : child.pet.level >= 10 ? '💎' : child.pet.level >= 6 ? '🌟' : '🐾'}</span>
                        <div>
                          <p className="text-sm font-bold text-text-main">{child.pet.name}</p>
                          <p className="text-xs text-text-sub">
                            Lv.{child.pet.level} · {child.pet.species} · 饱食 {child.pet.hunger}% · 心情 {child.pet.mood}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-sub">暂无宠物信息</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
