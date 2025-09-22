/**
 * Utilitários para tratamento global de erros
 */

interface ErrorInfo {
  message: string;
  source: string;
  lineno: number;
  colno: number;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

/**
 * Captura erros JavaScript globais e os reporta de forma segura
 */
export const setupGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return;

  const patchNextJsHead = () => {
    const originalConsoleError = console.error;

    if (typeof document !== 'undefined') {
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = function(selector: string) {
        try {
          const result = originalQuerySelectorAll.call(this, selector);
          
          if (selector.includes('meta[name="') || selector.includes('[content]')) {
            const filtered = Array.from(result).filter(element => {
              return element && 
                     element.getAttribute && 
                     typeof element.getAttribute('content') !== 'undefined';
            });
            const nodeList = {
              ...filtered,
              length: filtered.length,
              item: (index: number) => filtered[index] || null,
              [Symbol.iterator]: () => filtered[Symbol.iterator](),
              forEach: (callback: any) => filtered.forEach(callback)
            } as unknown as NodeListOf<Element>;
            return nodeList;
          }
          
          return result;
        } catch (error) {
          console.warn('Erro interceptado em querySelectorAll:', selector, error);
          return [] as any as NodeListOf<Element>;
        }
      };
    }
  };

  patchNextJsHead();

  // Capturar erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    const errorInfo: ErrorInfo = {
      message: event.message || 'Erro desconhecido',
      source: event.filename || 'Fonte desconhecida',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      stack: event.error?.stack || 'Stack trace não disponível',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log detalhado para debugging
    console.group('🚨 Erro JavaScript capturado');
    console.error('Mensagem:', errorInfo.message);
    console.error('Arquivo:', errorInfo.source, `(${errorInfo.lineno}:${errorInfo.colno})`);
    console.error('Stack trace:', errorInfo.stack);
    console.error('URL:', errorInfo.url);
    console.error('Timestamp:', new Date(errorInfo.timestamp).toISOString());
    console.groupEnd();

    // Verificar se é o erro específico que estamos procurando
    if (errorInfo.message.includes("Cannot read properties of null (reading 'content')")) {
      console.group('🔍 ERRO ESPECÍFICO DETECTADO');
      console.error('⚠️  Erro: Cannot read properties of null (reading \'content\')');
      console.error('📝 Possíveis causas:');
      console.error('   1. Acesso a CSS Module antes da hidratação');
      console.error('   2. Elemento DOM null tentando acessar .textContent');
      console.error('   3. Objeto de resposta API com propriedade content nula');
      console.error('   4. CSS-in-JS ou styled-components com referência nula');
      console.error('🧬 Stack trace completo:', errorInfo.stack);
      console.error('🌐 Context:', {
        userAgent: errorInfo.userAgent,
        url: errorInfo.url,
        timestamp: new Date(errorInfo.timestamp).toISOString(),
        viewportSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'
      });
      console.groupEnd();
      
      // Tentar identificar o frame específico
      if (errorInfo.stack) {
        const stackLines = errorInfo.stack.split('\n');
        const relevantLines = stackLines.filter(line => 
          line.includes('.tsx') || line.includes('.ts') || line.includes('.jsx') || line.includes('.js')
        ).slice(0, 5);
        
        if (relevantLines.length > 0) {
          console.group('📍 Localização provável do erro:');
          relevantLines.forEach((line, index) => {
            console.error(`${index + 1}. ${line.trim()}`);
          });
          console.groupEnd();
        }
      }
    }
  });

  // Capturar promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    console.group('🚨 Promise rejeitada não tratada');
    console.error('Motivo:', event.reason);
    console.error('Promise:', event.promise);
    console.error('URL:', window.location.href);
    console.groupEnd();
  });
};

/**
 * Wrapper seguro para funções que podem gerar erros
 */
export const safeExecute = <T>(
  fn: () => T,
  fallback: T,
  errorMessage?: string
): T => {
  try {
    return fn();
  } catch (error) {
    console.warn(errorMessage || 'Erro na execução segura:', error);
    return fallback;
  }
};

/**
 * Wrapper seguro para funções async
 */
export const safeExecuteAsync = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.warn(errorMessage || 'Erro na execução async segura:', error);
    return fallback;
  }
};
