// Utilitários para prevenção de erros de DOM

/**
 * Safely gets element by ID with null check
 */
export const safeGetElementById = (id: string): HTMLElement | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return document.getElementById(id);
  } catch (error) {
    console.warn(`Error accessing element with ID ${id}:`, error);
    return null;
  }
};

/**
 * Safely clicks an element if it exists
 */
export const safeClickElement = (id: string): boolean => {
  const element = safeGetElementById(id) as HTMLInputElement;
  if (element && typeof element.click === 'function') {
    element.click();
    return true;
  }
  return false;
};

/**
 * Check if window is available (client-side)
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Safely access window properties
 */
export const safeWindow = {
  innerWidth: () => isClient() ? window.innerWidth : 0,
  innerHeight: () => isClient() ? window.innerHeight : 0,
  location: {
    origin: () => isClient() ? window.location.origin : '',
    href: () => isClient() ? window.location.href : ''
  }
};

/**
 * Safely access localStorage
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Error accessing localStorage key ${key}:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (!isClient()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Error setting localStorage key ${key}:`, error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (!isClient()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key ${key}:`, error);
      return false;
    }
  }
};
