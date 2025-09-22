/**
 * Utilitários específicos para debug do erro "Cannot read properties of null (reading 'content')"
 */

/**
 * Wrapper seguro para acessar propriedades CSS modules
 */
export const safeStyleAccess = (styles: any, className: string, fallback = ''): string => {
  if (!styles) {
    console.warn(`⚠️  CSS Module styles object is null/undefined when accessing: ${className}`);
    return fallback;
  }
  
  if (typeof styles !== 'object') {
    console.warn(`⚠️  CSS Module styles is not an object when accessing: ${className}. Type: ${typeof styles}`);
    return fallback;
  }
  
  if (!(className in styles)) {
    console.warn(`⚠️  CSS class '${className}' not found in styles object. Available classes:`, Object.keys(styles));
    return fallback;
  }
  
  return styles[className] || fallback;
};

/**
 * Debug de acesso a propriedades de objetos
 */
export const debugPropertyAccess = (obj: any, property: string, context: string = 'unknown') => {
  console.group(`🔍 Debug Property Access: ${property} in ${context}`);
  console.log('Object:', obj);
  console.log('Property:', property);
  console.log('Object type:', typeof obj);
  console.log('Object keys:', obj ? Object.keys(obj) : 'null/undefined');
  console.log('Has property:', obj && property in obj);
  console.log('Property value:', obj ? obj[property] : 'object is null/undefined');
  console.groupEnd();
};

/**
 * Intercepta tentativas de acesso a .content em objetos
 */
export const safeContentAccess = (obj: any, context: string = 'unknown'): any => {
  if (!obj) {
    console.warn(`⚠️  Tentativa de acessar 'content' em objeto null/undefined. Context: ${context}`);
    return null;
  }
  
  if (!('content' in obj)) {
    console.warn(`⚠️  Propriedade 'content' não existe no objeto. Context: ${context}. Available properties:`, Object.keys(obj));
    return null;
  }
  
  return obj.content;
};

/**
 * Monitor de acessos a propriedades específicas
 */
export const createPropertyMonitor = (targetProperty: string = 'content') => {
  if (typeof window !== 'undefined' && typeof Proxy !== 'undefined') {
    // Interceptar acessos globais
    const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    
    Object.getOwnPropertyDescriptor = function(obj, prop) {
      if (prop === targetProperty && !obj) {
        console.error(`🚨 Detected access to '${targetProperty}' on null/undefined object!`);
        console.trace('Stack trace:');
      }
      return originalGetOwnPropertyDescriptor.call(this, obj, prop);
    };
  }
};
