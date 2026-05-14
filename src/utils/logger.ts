/**
 * Logging utility for Sharedocu
 * 
 * Features:
 * - Environment-aware logging (dev vs production)
 * - Log levels with filtering
 * - Structured logging with timestamps
 * - Sensitive data masking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

// Check if running in development mode
const isDev = __DEV__;

// Log level threshold (in production, only show errors)
const LOG_LEVEL_THRESHOLD: LogLevel = isDev ? 'debug' : 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL_THRESHOLD];
};

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  
  const masked = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  
  for (const key of sensitiveKeys) {
    if (masked[key]) {
      masked[key] = '***MASKED***';
    }
  }
  
  return masked;
};

const formatMessage = (level: LogLevel, message: string, data?: any): string => {
  const timestamp = formatTimestamp();
  const levelStr = level.toUpperCase();
  const dataStr = data ? ` ${JSON.stringify(maskSensitiveData(data))}` : '';
  return `[${timestamp}] [${levelStr}] ${message}${dataStr}`;
};

// Console logger (for development)
const consoleLog = (level: LogLevel, message: string, data?: any) => {
  if (!shouldLog(level)) return;
  
  const formattedMessage = formatMessage(level, message, data);
  
  switch (level) {
    case 'debug':
      console.log(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
};

// Log storage (for potential remote logging)
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

const bufferLog = (entry: LogEntry) => {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift(); // Remove oldest
  }
};

const log = {
  debug: (message: string, data?: any) => {
    consoleLog('debug', message, data);
    bufferLog({ level: 'debug', message, timestamp: new Date().toISOString(), data });
  },
  info: (message: string, data?: any) => {
    consoleLog('info', message, data);
    bufferLog({ level: 'info', message, timestamp: new Date().toISOString(), data });
  },
  warn: (message: string, data?: any) => {
    consoleLog('warn', message, data);
    bufferLog({ level: 'warn', message, timestamp: new Date().toISOString(), data });
  },
  error: (message: string, error?: Error, data?: any) => {
    const errorData = error 
      ? { ...data, error: error.message, stack: error.stack }
      : data;
    consoleLog('error', message, errorData);
    bufferLog({ level: 'error', message, timestamp: new Date().toISOString(), data: errorData });
  },
  
  // Get recent logs
  getRecentLogs: (count: number = 10): LogEntry[] => {
    return logBuffer.slice(-count);
  },
  
  // Clear log buffer
  clearLogs: () => {
    logBuffer.length = 0;
  },
};

export default log;
export type { LogLevel, LogEntry };
