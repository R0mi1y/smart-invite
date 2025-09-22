import { useState, useEffect } from 'react';

/**
 * Hook para detectar quando a hidratação do React está completa
 * Útil para prevenir erros de acesso ao DOM durante SSR
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};

/**
 * Hook para detectar se estamos no ambiente cliente
 */
export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
  }, []);

  return isClient;
};
