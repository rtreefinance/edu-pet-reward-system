import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function useApi() {
  const { token, logout } = useAuth();

  const call = useCallback(
    async <T = any>(
      url: string,
      options: { method?: HttpMethod; body?: any; params?: Record<string, string> } = {}
    ): Promise<T> => {
      const { method = 'GET', body, params } = options;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let fullUrl = url;
      if (params) {
        const qs = new URLSearchParams(params).toString();
        fullUrl += `?${qs}`;
      }

      const res = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 401) {
        logout();
        throw new Error('登录已过期，请重新登录');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      return data as T;
    },
    [token, logout]
  );

  return { call };
}

// Convenience hook for component-level loading/error state
function useApiState<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback(() => {
    setState({ data: null, loading: true, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback((error: string) => {
    setState({ data: null, loading: false, error });
  }, []);

  return { ...state, setLoading, setData, setError };
}

export { useApi, useApiState };
