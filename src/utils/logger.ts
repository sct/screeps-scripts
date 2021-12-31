enum LogLevel {
  ERROR,
  WARNING,
  INFO,
  DEBUG,
}

interface LogOptions extends Record<string, unknown> {
  label?: string;
}

class Log {
  private formatMessage(
    level: LogLevel,
    message: string,
    label?: string
  ): string {
    let levelText: string;

    switch (level) {
      case LogLevel.ERROR:
        levelText = 'ERROR';
        break;
      case LogLevel.WARNING:
        levelText = 'WARNING';
        break;
      case LogLevel.INFO:
        levelText = 'INFO';
        break;
      case LogLevel.DEBUG:
        levelText = 'DEBUG';
        break;
      default:
        levelText = 'UNKNOWN';
        break;
    }

    return `[${levelText}]${label ? `[${label}]` : ''} ${message}`;
  }

  public log(level: LogLevel, message: string, options?: LogOptions): void {
    const formattedMessage = this.formatMessage(level, message, options?.label);
    const logArgs: [string, string?] = [formattedMessage];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let other;

    if (options) {
      delete options.label;
      if (Object.keys(options).length > 0) {
        other = options;
        logArgs.push(JSON.stringify(other, null, ' '));
      }
    }

    switch (level) {
      case LogLevel.ERROR:
        console.error(...logArgs);
        break;
      case LogLevel.WARNING:
        console.log(...logArgs);
        break;
      case LogLevel.INFO:
        console.log(...logArgs);
        break;
      case LogLevel.DEBUG:
        console.log(...logArgs);
        break;
    }
  }

  public error(message: string, options?: LogOptions): void {
    this.log(LogLevel.ERROR, message, options);
  }

  public warning(message: string, options?: LogOptions): void {
    this.log(LogLevel.WARNING, message, options);
  }

  public info(message: string, options?: LogOptions): void {
    this.log(LogLevel.INFO, message, options);
  }

  public debug(message: string, options?: LogOptions): void {
    this.log(LogLevel.DEBUG, message, options);
  }
}

const log = new Log();

export default log;
