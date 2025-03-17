/**
 * express-router-diagram
 * A middleware to extract and print routes from Express.js applications
 */

const fs = require("node:fs");
const path = require("node:path");
const { setupWebRoute, generateRoutesOnStartup } = require("./webDiagram");
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

/**
 * Express middleware that extracts and prints all routes
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
function routerDiagramMiddleware(options = {}) {
  const defaultOptions = {
    logToConsole: true,
    outputFile: null,
    excludePatterns: [],
    hierarchical: true, // Default to hierarchical view
    generateWeb: false, // Whether to add a web route for visualization
    preGeneratedRoutes: null, // Pre-generated routes to use instead of extracting them
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

  return (req, res, next) => {
    // Check if this is a request to the web visualization routes
    const webRoutePath = config.webRoute;
    const dataRoutePath = `${webRoutePath}-data`;

    if (config.generateWeb && (req.path === webRoutePath || req.path === dataRoutePath)) {
      // Use pre-generated routes if provided, otherwise extract them
      let routes =
        config.preGeneratedRoutes || req.app._routerDiagramRoutes || extractRoutesFromApp(req.app);

      // Apply excludePatterns for the data endpoint
      if (
        req.path === dataRoutePath &&
        config.excludePatterns &&
        config.excludePatterns.length > 0
      ) {
        routes = filterRoutes(routes, config.excludePatterns);
      }

      if (req.path === dataRoutePath) {
        // Return routes as JSON
        return res.json(routes);
      }

      if (req.path === webRoutePath) {
        try {
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

          // Serve the HTML file directly
          return res.sendFile(templatePath);
        } catch (error) {
          console.error("Error in D3 visualization:", error);
          return res.status(500).send("Error generating D3 visualization: ", error.message);
        }
      }

      return; // Stop middleware chain
    }

    // Extract routes on the first request
    if (!req.app._routerDiagramProcessed) {
      // Mark as processed to avoid running on every request
      req.app._routerDiagramProcessed = true;

      // Use pre-generated routes if provided, otherwise extract them
      const routes = config.preGeneratedRoutes || extractRoutesFromApp(req.app);

      // Filter routes if needed
      const filteredRoutes = filterRoutes(routes, config.excludePatterns);

      // Store routes for later use
      req.app._routerDiagramRoutes = filteredRoutes;

      // Print routes to console if enabled
      if (config.logToConsole) {
        printRoutesInMiddleware(filteredRoutes, config);
      }

      // Save to file if specified
      if (config.outputFile) {
        const diagram = generateTextDiagram(filteredRoutes, {
          hierarchical: config.hierarchical
        });
        saveDiagram(diagram, config.outputFile);
      }

      // If generateWeb is enabled, add a route to view the diagram
      if (config.generateWeb) {
        // Add the web route handler
        setupWebRoute(req.app, filteredRoutes, config.webRoute);
      }
    }

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

// Export the middleware as the default export
module.exports = routerDiagramMiddleware;

// Export additional functions for programmatic use
module.exports.extractRoutesFromApp = extractRoutesFromApp;
module.exports.printRoutes = printRoutes;
module.exports.printAppRoutes = printAppRoutes;
module.exports.generateTextDiagram = generateTextDiagram;
module.exports.saveDiagram = saveDiagram;
module.exports.generateRoutesOnStartup = generateRoutesOnStartup;
module.exports.organizeRoutesHierarchy = organizeRoutesHierarchy;
