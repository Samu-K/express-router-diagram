/**
 * Route printing functionality for Express Router Diagram
 * This module contains functions for printing routes in various formats
 */

// Import all utilities from their respective modules
const colorUtils = require("./utils/colorUtils");
const hierarchyUtils = require("./utils/hierarchyUtils");
const fileUtils = require("./utils/fileUtils");
const filterUtils = require("./utils/filterUtils");
const diagramUtils = require("./utils/diagramUtils");
const printingFunctions = require("./utils/printingFunctions");

// Export all modules and functions
module.exports = {
  // Color utilities
  colors: colorUtils.colors,
  getMethodColor: colorUtils.getMethodColor,
  colorizeMethods: colorUtils.colorizeMethods,
  colorizeMethodsString: colorUtils.colorizeMethodsString,

  // Hierarchy utilities
  organizeRoutesHierarchy: hierarchyUtils.organizeRoutesHierarchy,
  printHierarchyToString: hierarchyUtils.printHierarchyToString,
  processHierarchyNode: hierarchyUtils.processHierarchyNode,
  getLinePrefix: hierarchyUtils.getLinePrefix,
  getChildPrefix: hierarchyUtils.getChildPrefix,

  // File utilities
  saveDiagram: fileUtils.saveDiagram,

  // Diagram generation
  generateTextDiagram: diagramUtils.generateTextDiagram,

  // Route filtering
  filterRoutes: filterUtils.filterRoutes,

  // Main printing functions
  printRoutes: printingFunctions.printRoutes,
  printAppRoutes: printingFunctions.printAppRoutes,
  printRoutesInMiddleware: printingFunctions.printRoutesInMiddleware
};
