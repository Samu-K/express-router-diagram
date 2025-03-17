/**
 * Utilities for organizing and displaying route hierarchies
 */

const colorUtils = require("./colorUtils");

const hierarchyUtils = {
  /**
   * Organizes routes into a hierarchical structure
   * @param {Array} routes - Array of route objects
   * @returns {Object} Hierarchical structure of routes
   */
  organizeRoutesHierarchy(routes) {
    if (!routes || routes.length === 0) {
      return {};
    }

    const hierarchy = {};

    // Sort routes by path for consistent output
    routes.sort((a, b) => a.path.localeCompare(b.path));

    routes.forEach((route) => {
      // Handle root path specially
      if (route.path === "/") {
        if (!hierarchy.root) {
          hierarchy.root = [];
        }
        hierarchy.root.push(route);
        return;
      }

      // Split the path into segments
      const segments = route.path.split("/").filter((segment) => segment);

      // Start at the root of the hierarchy
      let current = hierarchy;

      // Process each segment to build the hierarchy
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Make sure the current node exists
        if (!current[segment]) {
          current[segment] = {};
        }

        // If this is the last segment, add route information
        if (i === segments.length - 1) {
          // Add routes array if it doesn't exist
          if (!current[segment]._routes) {
            current[segment]._routes = [];
          }

          // Add this route to the routes array
          current[segment]._routes.push(route);

          // Also store methods for easier access
          if (!current[segment]._methods) {
            current[segment]._methods = [];
          }

          // Add each method if not already present
          if (route.methods && Array.isArray(route.methods)) {
            route.methods.forEach((method) => {
              if (!current[segment]._methods.includes(method)) {
                current[segment]._methods.push(method);
              }
            });
          }
        } else {
          // Move to the next level in the hierarchy
          current = current[segment];
        }
      }
    });

    return hierarchy;
  },

  /**
   * Get the line prefix for the current level and position
   * @param {number} level - Current level in the hierarchy
   * @param {boolean} isLast - Whether this is the last item at this level
   * @returns {string} The line prefix
   */
  getLinePrefix(level, isLast) {
    if (level === 0) {
      return "";
    }

    // Build the prefix with vertical lines for each level
    let prefix = "";
    for (let i = 0; i < level - 1; i++) {
      prefix += "│ ";
    }

    // Add the branch character
    prefix += isLast ? "└─ " : "├─ ";

    return prefix;
  },

  /**
   * Get the prefix for child items
   * @param {number} level - Current level in the hierarchy
   * @param {boolean} isLast - Whether this is the last item at this level
   * @returns {string} The child prefix
   */
  getChildPrefix(level, isLast) {
    // Build the prefix with vertical lines for each level
    let prefix = "";
    for (let i = 0; i < level; i++) {
      // For the last level, use space if this is the last item
      if (i === level - 1 && isLast) {
        prefix += "  ";
      } else {
        prefix += "│ ";
      }
    }

    return prefix;
  },

  /**
   * Process a node in the hierarchy for printing
   * @param {string} key - The key of the node
   * @param {any} value - The value of the node
   * @param {number} level - Current indentation level
   * @param {boolean} isLast - Whether this is the last item at this level
   * @param {Object} options - Display options
   * @returns {string} String representation of the node
   */
  processHierarchyNode(key, value, level, isLast, options = {}) {
    let result = "";

    // Extract useColors option
    const useColors = options.useColors === true;

    // Get the prefix for this line
    const linePrefix = this.getLinePrefix(level, isLast);

    // Check if this node has methods (from the _methods property)
    if (value && value._methods && Array.isArray(value._methods) && value._methods.length > 0) {
      // Print node with methods
      const methods = value._methods.sort();
      if (useColors) {
        result += `${linePrefix}${key} [${colorUtils.colorizeMethodsString(methods)}]\n`;
      } else {
        result += `${linePrefix}${key} [${methods.join(", ")}]\n`;
      }
    } else {
      // Print node without methods
      result += `${linePrefix}${key}\n`;
    }

    // Process child nodes (skip special properties starting with _)
    if (value && typeof value === "object") {
      const childKeys = Object.keys(value)
        .filter((k) => !k.startsWith("_"))
        .sort();

      childKeys.forEach((childKey, index) => {
        const childIsLast = index === childKeys.length - 1;
        result += this.processHierarchyNode(
          childKey,
          value[childKey],
          level + 1,
          childIsLast,
          options
        );
      });
    }

    return result;
  },

  /**
   * Prints a hierarchical view of routes to a string
   * @param {Object} hierarchy - Hierarchical structure of routes
   * @param {number} level - Current indentation level
   * @param {Object} options - Display options
   * @returns {string} String representation of the hierarchy
   */
  printHierarchyToString(hierarchy, level = 0, options = {}) {
    let result = "";

    // Handle empty hierarchy
    if (!hierarchy || Object.keys(hierarchy).length === 0) {
      return "No routes found\n";
    }

    // Get all keys except special ones (starting with _)
    const keys = Object.keys(hierarchy)
      .filter((k) => !k.startsWith("_"))
      .sort();

    // Process each key
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      result += this.processHierarchyNode(key, hierarchy[key], level, isLast, options);
    });

    return result;
  }
};

module.exports = {
  organizeRoutesHierarchy: hierarchyUtils.organizeRoutesHierarchy.bind(hierarchyUtils),
  printHierarchyToString: hierarchyUtils.printHierarchyToString.bind(hierarchyUtils),
  processHierarchyNode: hierarchyUtils.processHierarchyNode.bind(hierarchyUtils),
  getLinePrefix: hierarchyUtils.getLinePrefix.bind(hierarchyUtils),
  getChildPrefix: hierarchyUtils.getChildPrefix.bind(hierarchyUtils)
};
