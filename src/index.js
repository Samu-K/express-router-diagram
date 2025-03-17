/**
 * express-router-diagram
 * A middleware to extract and print routes from Express.js applications
 */

const fs = require("node:fs");
const path = require("node:path");
const { generateRoutesOnStartup } = require("./webDiagram");
const { extractRoutesFromApp } = require("./extractRoutes");
const {
  colors,
  colorizeMethods,
  organizeRoutesHierarchy,
  printHierarchyToString,
  printRoutes,
  generateTextDiagram,
  saveDiagram,
  printRoutesInMiddleware,
  filterRoutes
} = require("./printRoutes");
const express = require("express");

/**
 * Express middleware that extracts and prints all routes
 * Note: Routes are printed when the first request is processed by the middleware.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.logToConsole - Enable/disable console logging of routes
 * @param {string} options.outputFile - Path to output file
 * @param {Array} options.excludePatterns - Array of regex patterns to exclude from output
 * @param {boolean} options.hierarchical - Display routes in a hierarchical structure
 * @param {boolean} options.generateWeb - Generate web visualization
 * @param {string} options.webRoute - Custom route path for web visualization
 * @returns {Function} Express middleware function
 */
function routerDiagramMiddleware(options = {}) {
  const defaultOptions = {
    logToConsole: true,
    outputFile: null,
    excludePatterns: [],
    hierarchical: true, // Default to hierarchical view
    generateWeb: false, // Whether to add a web route for visualization
    webRoute: "/express-routes" // Custom route path for the web visualization
  };

  const config = { ...defaultOptions, ...options };

  // Ensure webRoute has a leading slash
  if (config.webRoute && !config.webRoute.startsWith("/")) {
    config.webRoute = `/${config.webRoute}`;
  }

  // Try to require Express
  try {
    require("express");
  } catch (_) {
    console.error("Express is required for the middleware. Make sure it is installed.");
  }

  // Show diagram paths if visualization is enabled
  if (config.generateWeb && !global._routerDiagramPathsPrinted) {
    global._routerDiagramPathsPrinted = true;

    // Print with extra visibility
    console.log("\n=====================================================");
    console.log(`EXPRESS ROUTES DIAGRAM AVAILABLE AT: ${config.webRoute}`);
    console.log(`EXPRESS ROUTES JSON DATA AVAILABLE AT: ${config.webRoute}-data`);
    console.log("=====================================================\n");
  }

  // Variable to store the app instance for processing routes
  let appInstance = null;

  // Flag to track if processing is needed
  let needsProcessing = true;

  // The middleware function
  return (req, res, next) => {
    // Store the app instance for later processing
    if (!appInstance && req.app) {
      appInstance = req.app;
    }

    // Check if this is a request to the web visualization routes
    const webRoutePath = config.webRoute;
    const dataRoutePath = `${webRoutePath}-data`;

    // Process routes immediately if we haven't done so and we have the app instance
    if (needsProcessing && appInstance) {
      needsProcessing = false;

      // Extract routes for console/file output
      const routes = extractRoutesFromApp(appInstance);

      // Filter routes if needed
      const filteredRoutes = filterRoutes(routes, config.excludePatterns);

      // Print routes to console
      console.log("\n=====================================================");
      console.log("EXPRESS ROUTES:");
      console.log("=====================================================\n");

      printRoutesInMiddleware(filteredRoutes, config);

      // Save to file if specified
      if (config.outputFile) {
        const diagram = generateTextDiagram(filteredRoutes, {
          hierarchical: config.hierarchical
        });
        saveDiagram(diagram, config.outputFile);
      }

      // Set up static file serving for D3 visualization
      if (config.generateWeb) {
        const publicDir = path.join(__dirname, "..", "public");
        if (fs.existsSync(publicDir)) {
          // Serve the entire public directory
          appInstance.use(express.static(publicDir));
        }
      }
    }

    // Handle visualization routes
    if (config.generateWeb && (req.path === webRoutePath || req.path === dataRoutePath)) {
      if (req.path === dataRoutePath) {
        // Extract fresh routes from the app
        const routes = extractRoutesFromApp(req.app);
        // Filter routes if needed
        const filteredRoutes = filterRoutes(routes, config.excludePatterns);
        // Return as JSON
        return res.json(filteredRoutes);
      }
      if (req.path === webRoutePath) {
        try {
          // Extract routes from the app
          const routes = extractRoutesFromApp(req.app);
          // Filter routes if needed
          const filteredRoutes = filterRoutes(routes, config.excludePatterns);

          // Path to the D3 HTML template
          const templatePath = path.join(__dirname, "..", "views", "d3-diagram.html");

          // Check if the template exists
          if (!fs.existsSync(templatePath)) {
            console.error("D3 diagram template file not found at:", templatePath);
            return res
              .status(500)
              .send(
                "D3 diagram template file not found. Make sure the views directory is properly set up."
              );
          }

          // Read the HTML template
          let html = fs.readFileSync(templatePath, "utf8");

          // Embed the routes data directly in the HTML
          const routesJson = JSON.stringify(filteredRoutes);
          html = html.replace(
            "/* ROUTES_DATA_PLACEHOLDER */",
            `const initialRoutesData = ${routesJson};`
          );

          // Send the modified HTML
          return res.send(html);
        } catch (error) {
          console.error("Error in D3 visualization:", error);
          return res.status(500).send("Error generating D3 visualization: ", error.message);
        }
      }

      return; // Stop middleware chain
    }

    // Continue to the next middleware
    next();
  };
}

/**
 * Standalone function to print routes from an Express app
 * This can be used without adding the middleware
 * @param {Object} app - Express application instance
 * @param {Object} options - Configuration options
 */
function printAppRoutes(app, options = {}) {
  const defaultOptions = {
    logToConsole: true,
    outputFile: null,
    excludePatterns: [],
    hierarchical: true, // Default to hierarchical view
    colorOutput: false // Default to no colors in file output
  };

  const config = { ...defaultOptions, ...options };

  const routes = extractRoutesFromApp(app);

  // Filter routes if needed
  const filteredRoutes = filterRoutes(routes, config.excludePatterns);

  if (config.logToConsole) {
    // Always print the header
    console.log("\n\x1b[1m\x1b[36mEXPRESS ROUTES\x1b[0m");
    console.log("\x1b[36m=============\x1b[0m\n");

    if (config.hierarchical !== false) {
      // Generate hierarchical diagram
      const hierarchy = organizeRoutesHierarchy(filteredRoutes);

      // Use the fixed printHierarchyToString function
      const hierarchyString = printHierarchyToString(hierarchy);
      console.log(hierarchyString);
    } else {
      // Generate flat list diagram
      filteredRoutes.forEach((route) => {
        const methods =
          route.methods && route.methods.length > 0 ? route.methods.join(", ") : "UNKNOWN";
        console.log(`[${colorizeMethods(methods)}] ${route.path}`);
      });
    }

    console.log(`\n${colors.reset}Total routes: ${filteredRoutes.length}`);
  }

  // Save to file if specified
  if (config.outputFile) {
    const diagram = generateTextDiagram(filteredRoutes, {
      hierarchical: config.hierarchical,
      colorOutput: config.colorOutput // Pass the color option
    });
    saveDiagram(diagram, config.outputFile);
  }

  return filteredRoutes;
}

/**
 * Print routes directly from the middleware function
 * @param {Object} app - Express application instance
 * @param {Object} options - Configuration options (same as middleware)
 */
function printRoutesFromMiddleware(app, options = {}) {
  const defaultOptions = {
    logToConsole: true,
    outputFile: null,
    excludePatterns: [],
    hierarchical: true
  };

  const config = { ...defaultOptions, ...options };

  console.log("\n=====================================================");
  console.log("EXPRESS ROUTES:");
  console.log("=====================================================\n");

  // Extract routes from the app
  const routes = extractRoutesFromApp(app);

  // Filter routes if needed
  const filteredRoutes = filterRoutes(routes, config.excludePatterns);

  // Print routes to console
  printRoutesInMiddleware(filteredRoutes, config);

  // Save to file if specified
  if (config.outputFile) {
    const diagram = generateTextDiagram(filteredRoutes, {
      hierarchical: config.hierarchical
    });
    saveDiagram(diagram, config.outputFile);
  }

  return filteredRoutes;
}

// Export the middleware as the default export
module.exports = routerDiagramMiddleware;

// Export additional functions for programmatic use
module.exports.extractRoutesFromApp = extractRoutesFromApp;
module.exports.printRoutes = printRoutes;
module.exports.printAppRoutes = printAppRoutes;
module.exports.printRoutesFromMiddleware = printRoutesFromMiddleware;
module.exports.generateTextDiagram = generateTextDiagram;
module.exports.saveDiagram = saveDiagram;
module.exports.generateRoutesOnStartup = generateRoutesOnStartup;
module.exports.organizeRoutesHierarchy = organizeRoutesHierarchy;

/**
 * Get the paths where visualization routes are available
 * @param {Object} options - Optional configuration (defaults to middleware defaults)
 * @returns {Object} Object with web and data path properties
 */
function getVisualizationPaths(options = {}) {
  const defaultWebRoute = "/express-routes";
  // If options are provided, use those, otherwise use default
  let webRoute = options.webRoute || defaultWebRoute;

  // Ensure webRoute has a leading slash
  if (webRoute && !webRoute.startsWith("/")) {
    webRoute = `/${webRoute}`;
  }

  return {
    web: webRoute,
    data: `${webRoute}-data`
  };
}

// Export the helper function
module.exports.getVisualizationPaths = getVisualizationPaths;
