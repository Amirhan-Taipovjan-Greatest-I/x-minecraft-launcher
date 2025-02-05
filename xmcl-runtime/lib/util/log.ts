export interface Logger {
  log(message: any, ...options: any[]): void
  warn(message: any, ...options: any[]): void
  error(message: Error, scope?: string): void
}
