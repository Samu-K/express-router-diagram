/**
 * Color utilities for terminal output
 */

const colorUtils = {
  // ANSI color codes for terminal output
  colors: {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
  },

  /**
   * Get color for HTTP method
   * @param {string} method - HTTP method
   * @returns {string} ANSI color code
   */
  getMethodColor(method) {
    switch (method.toUpperCase()) {
      case "GET":
        return this.colors.green;
      case "POST":
        return this.colors.blue;
      case "PUT":
        return this.colors.yellow;
      case "DELETE":
        return this.colors.red;
      case "PATCH":
        return this.colors.cyan;
      default:
        return this.colors.white;
    }
  },

  /**
   * Colorize a method or list of methods
   * @param {string|Array} methods - HTTP method or array of methods
   * @returns {string} Colorized method string
   */
  colorizeMethods(methods) {
    if (Array.isArray(methods)) {
      return methods
        .map((method) => `${this.getMethodColor(method)}${method}${this.colors.reset}`)
        .join(", ");
    }
    return `${this.getMethodColor(methods)}${methods}${this.colors.reset}`;
  },

  /**
   * Colorize methods and return as a string
   * @param {Array} methods - Array of HTTP methods
   * @returns {string} Colorized methods string
   */
  colorizeMethodsString(methods) {
    return methods
      .map((method) => {
        const color = this.getMethodColor(method);
        return `${color}${method}${this.colors.reset}`;
      })
      .join(", ");
  }
};

module.exports = {
  colors: colorUtils.colors,
  getMethodColor: colorUtils.getMethodColor.bind(colorUtils),
  colorizeMethods: colorUtils.colorizeMethods.bind(colorUtils),
  colorizeMethodsString: colorUtils.colorizeMethodsString.bind(colorUtils)
};
