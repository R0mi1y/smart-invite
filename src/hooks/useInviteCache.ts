import { useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/domUtils';

interface CachedInviteData {
  token: string;
  numPeople: number;
  confirmed: boolean;
  declined: boolean;
  lastUpdated: number;
}

const CACHE_KEY = 'smart-invite-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export const useInviteCache = (token: string) => {
  const [cachedData, setCachedData] = useState<CachedInviteData | null>(null);

  // Carregar do cache
  useEffect(() => {
    if (!token) return;

    try {
      const cached = safeLocalStorage.getItem(`${CACHE_KEY}-${token}`);
      if (cached) {
        const data: CachedInviteData = JSON.parse(cached);
        
        // Verificar se o cache ainda é válido
        if (Date.now() - data.lastUpdated < CACHE_DURATION) {
          setCachedData(data);
        } else {
          // Cache expirado, remover
          safeLocalStorage.removeItem(`${CACHE_KEY}-${token}`);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
  }, [token]);

  // Salvar no cache
  const saveToCache = (numPeople: number, confirmed: boolean, declined: boolean) => {
    if (!token) return;

    const data: CachedInviteData = {
      token,
      numPeople,
      confirmed,
      declined,
      lastUpdated: Date.now()
    };

    try {
      safeLocalStorage.setItem(`${CACHE_KEY}-${token}`, JSON.stringify(data));
      setCachedData(data);
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  };

  // Limpar cache
  const clearCache = () => {
    if (!token) return;

    try {
      safeLocalStorage.removeItem(`${CACHE_KEY}-${token}`);
      setCachedData(null);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  return {
    cachedData,
    saveToCache,
    clearCache
  };
};
