import util from 'util'

import { createLogger, format, transports } from 'winston'
import { TransformableInfo } from 'logform'

// Helper function to format payloads as JSON

const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	),
	transports: [
		// Human-readable log transport
		new transports.File({
			filename: 'logs/latest.log',
			format: format.combine(
				format.printf(({ timestamp, level, message, ...meta }: TransformableInfo) => {
					const rest = Object.keys(meta).length > 0 ? util.inspect(meta, { colors: false, depth: 2 }) : ''
					return `${timestamp} [${level.toUpperCase()}] ${message}${rest ? `\n${rest}` : ''}`
				}),
			),
		}),
		// JSON log transport
		new transports.File({
			filename: 'logs/latest_log.jsonl',
			format: format.combine(
				format.json(),
				format.printf(({ timestamp, level, message, ...meta }) => {
					return JSON.stringify({
						timestamp,
						level,
						message,
						meta,
					})
				}),
			),
		}),
		new transports.Console({
			format: format.combine(
				format.printf(({ timestamp, level, message, ...meta }: TransformableInfo) => {
					const rest = Object.keys(meta).length > 0 ? util.inspect(meta, { colors: true, depth: 2 }) : ''
					return `${timestamp} [${level.toUpperCase()}] ${message}${rest && ['verbose', 'debug', 'error'].includes(level) ? `\n${rest}` : ''}`
				}),
				format.colorize({ all: true }),
			),
		}),
	],
})

logger.info('Logging started')

export default logger
