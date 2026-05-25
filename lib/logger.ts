type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const explicit = process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL;
  if (explicit && explicit in LEVEL_ORDER) return explicit as LogLevel;
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
}

const MIN_LEVEL = LEVEL_ORDER[resolveMinLevel()];

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= MIN_LEVEL;
}

function emit(level: LogLevel, scope: string | undefined, args: unknown[]) {
  if (!shouldLog(level)) return;
  const prefix = scope ? `[${scope}]` : '';
  const fn = level === 'debug' ? console.debug : level === 'info' ? console.info : level === 'warn' ? console.warn : console.error;
  if (prefix) fn(prefix, ...args);
  else fn(...args);
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Returns a child logger with its tag appended after the parent scope. */
  child: (subscope: string) => Logger;
}

function createLogger(scope?: string): Logger {
  return {
    debug: (...args) => emit('debug', scope, args),
    info: (...args) => emit('info', scope, args),
    warn: (...args) => emit('warn', scope, args),
    error: (...args) => emit('error', scope, args),
    child: (subscope) => createLogger(scope ? `${scope}:${subscope}` : subscope),
  };
}

/** Default unscoped logger. Prefer `logger.child('feature')` to add context. */
export const logger = createLogger();

/** Build a scoped logger directly (shorthand for logger.child(scope)). */
export function getLogger(scope: string): Logger {
  return createLogger(scope);
}
