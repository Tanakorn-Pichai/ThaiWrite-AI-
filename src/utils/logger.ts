type LogContext = Record<string, string | number | boolean | undefined>;

const isDevelopment = import.meta.env.DEV;

function write(level: 'info' | 'warn' | 'error', event: string, context: LogContext = {}) {
  const payload = { event, timestamp: new Date().toISOString(), ...context };
  if (level === 'error') console.error('[ThaiWrite]', payload);
  else if (level === 'warn') console.warn('[ThaiWrite]', payload);
  else if (isDevelopment) console.info('[ThaiWrite]', payload);
}

export const appLogger = {
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) => write('error', event, context),
};
