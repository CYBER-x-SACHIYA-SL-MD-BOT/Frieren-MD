import winston from 'winston';
import path from 'path';
import moment from 'moment-timezone';

const logDir = 'logs';

// Custom format for WIB (Western Indonesia Time)
const wibTime = () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: wibTime }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'FRIERENY-bot' },
  transports: [
    new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp({ format: wibTime }),
            winston.format.json()
        )
    }),
    new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log'),
        format: winston.format.combine(
            winston.format.timestamp({ format: wibTime }),
            winston.format.json()
        )
    }),
  ],
});

// Structured Console Log for Development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, service, stack, ...rest }) => {
        const extra = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
        const errorStack = stack ? `\n${stack}` : '';
        return `[${timestamp}] [${service}] ${level}: ${message}${extra}${errorStack}`;
      })
    ),
  }));
}

// Override console methods to capture logs with structure
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

const formatArgs = (args) => {
    return args.map(arg => {
        if (arg instanceof Error) {
            return {
                name: arg.name,
                message: arg.message,
                stack: arg.stack,
                ...(arg.response ? { data: arg.response.data, status: arg.response.status } : {})
            };
        }
        return arg;
    });
};

console.log = (...args) => {
    const formatted = formatArgs(args);
    logger.info(formatted.length === 1 ? formatted[0] : { messages: formatted });
    originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
    const formatted = formatArgs(args);
    // If first arg is an error, use its message as primary and rest as metadata
    if (args[0] instanceof Error) {
        logger.error(args[0].message, { details: formatted.slice(1), stack: args[0].stack });
    } else {
        logger.error('Console Error', { details: formatted });
    }
    originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
    const formatted = formatArgs(args);
    logger.warn(formatted.length === 1 ? formatted[0] : { messages: formatted });
    originalConsoleWarn.apply(console, args);
};

console.info = (...args) => {
    const formatted = formatArgs(args);
    logger.info(formatted.length === 1 ? formatted[0] : { messages: formatted });
    originalConsoleInfo.apply(console, args);
};

export default logger;
