import * as winston from 'winston'
const { combine, timestamp, json, colorize, align } = winston.format

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), align(), winston.format.printf((nfo: any) => {
        return `${nfo.level}: ${nfo.message}`
      }))
    }),
    new winston.transports.File({
      filename: 'combined.log',
      level: 'debug',
      maxsize: 500000,
      format: combine(timestamp(), json())
    }),
  ]
})
