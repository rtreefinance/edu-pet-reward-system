import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { StudentUser } from '@shared/types';
import ShopItem from '../components/ShopItem';
import CoinDisplay from '../components/CoinDisplay';

interface ShopAccessory {
  _id: string;
  name: string;
  icon: string;
  price: number;
  type: string;
  owned: boolean;
}

export default function PetShop() {
  const { user, refreshUser } = useAuth();
  const { call } = useApi();
  const navigate = useNavigate();
  const student = user as StudentUser;

  const [items, setItems] = useState<ShopAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadShop = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await call<{ items: ShopAccessory[] }>('/api/pet/shop');
      setItems(res.items || []);
    } catch (err: any) {
      setError(err.message || '加载商店失败');
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const handleBuy = async (itemId: string) => {
    if (buyingId) return;
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    if (student.coins < item.price) {
      alert('💰 金币不足，快去完成作业赚金币吧！');
      return;
    }

    setBuyingId(itemId);
    try {
      await call('/api/pet/buy-accessory', {
        method: 'POST',
        body: { name: item.name, icon: item.icon, price: item.price },
      });
      await refreshUser();
      // Mark as owned locally
      setItems((prev) =>
        prev.map((i) => (i._id === itemId ? { ...i, owned: true } : i))
      );
    } catch (err: any) {
      alert(err.message || '购买失败');
    } finally {
      setBuyingId(null);
    }
  };

  if (!student) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="card flex items-center justify-between px-5 py-4">
        <div>
          <h1 className="text-lg font-extrabold text-text-main">🛍️ 宠物商店</h1>
          <p className="text-xs text-text-sub mt-0.5">为你的宠物添置装饰品</p>
        </div>
        <CoinDisplay coins={student.coins} size="md" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 flex flex-col items-center gap-3">
              <div className="skeleton w-16 h-16 rounded-full" />
              <div className="skeleton w-16 h-4" />
              <div className="skeleton w-12 h-3" />
              <div className="skeleton w-full h-9" />
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
          <button onClick={loadShop} className="btn-secondary text-sm">
            重新加载
          </button>
        </div>
      )}

      {/* Items Grid */}
      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="empty-state">
              <span className="text-4xl mb-3">📦</span>
              <p className="font-bold text-text-main mb-1">商店空空如也</p>
              <p className="text-sm text-text-sub">暂时没有可购买的物品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <ShopItem
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  icon={item.icon}
                  price={item.price}
                  type={item.type}
                  owned={item.owned}
                  onBuy={handleBuy}
                  disabled={buyingId === item._id || student.coins < item.price}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Back button */}
      <div className="text-center">
        <button onClick={() => navigate(-1)} className="btn-outline text-sm">
          ← 返回
        </button>
      </div>
    </div>
  );
}
