/**
 * Utilities for filtering routes
 */

const filterUtils = {
  /**
   * Filter routes based on exclude patterns
   * @param {Array} routes - Array of route objects
   * @param {Array} excludePatterns - Array of patterns to exclude
   * @returns {Array} Filtered routes
   */
  filterRoutes(routes, excludePatterns) {
    if (!excludePatterns || excludePatterns.length === 0) {
      return routes;
    }

    return routes.filter(
      (route) =>
        !excludePatterns.some((pattern) => {
          if (typeof pattern === "string") {
            return route.path.includes(pattern);
          }
          if (pattern instanceof RegExp) {
            return pattern.test(route.path);
          }
          return false;
        })
    );
  }
};

module.exports = {
  filterRoutes: filterUtils.filterRoutes
};
