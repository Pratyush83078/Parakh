'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export function useProjectDetails() {
  const [detail, setDetail] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  const open = useCallback(async code => {
    const id = ++request.current;
    setPending(true);
    setError(null);
    try {
      const [project, peers] = await Promise.all([api.project(encodeURIComponent(code)), api.peers(encodeURIComponent(code)).catch(() => null)]);
      if (id === request.current) setDetail({ project, peers });
    } catch {
      if (id === request.current) setError('This project could not be loaded. Please try opening it again.');
    } finally {
      if (id === request.current) setPending(false);
    }
  }, []);
  const close = useCallback(() => { request.current += 1; setDetail(null); setPending(false); }, []);
  return { detail, pending, error, open, close };
}
