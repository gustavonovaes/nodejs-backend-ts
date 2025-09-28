import winston from "winston";

const transports = [];
if (process.env.NODE_ENV !== "production") {
  transports.push(new winston.transports.Console());
} else {
  transports.push(
    new winston.transports.File({ filename: "error.log", level: "error" })
  );
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports,
});
