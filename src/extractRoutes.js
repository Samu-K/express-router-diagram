/**
 * Route extraction functionality for Express Router Diagram
 * This module contains functions for extracting routes from Express.js applications
 */

/**
 * Extract all routes from an Express application
 * @param {Object} app - Express application instance
 * @returns {Array} Array of route objects
 */
function extractRoutesFromApp(app) {
  if (!app) {
    console.error("Invalid Express app provided");
    return [];
  }

  // If the app is not initialized, initialize it
  if (typeof app === "function" && !app._router) {
    try {
      // This is likely an uninitialized Express app
      // We need to initialize it to get the router
      const tempApp = app();
      if (tempApp && (tempApp._router || tempApp.router || tempApp.stack)) {
        // biome-ignore lint: need to init
        app = tempApp;
      }
    } catch (error) {
      // Ignore initialization errors
      console.error("Could not initialize Express app:", error.message);
    }
  }

  const routes = [];

  // Get the router stack from the app
  // Handle different ways the router might be exposed
  let stack;

  if (app._router && app._router.stack) {
    // Standard Express app
    stack = app._router.stack;
  } else if (app.router && app.router.stack) {
    // Some Express apps expose router differently
    stack = app.router.stack;
  } else if (app.stack) {
    // Express app might expose stack directly
    stack = app.stack;
  } else if (app.handle && app.handle.stack) {
    // Another possible structure
    stack = app.handle.stack;
  } else {
    console.error(
      "No router stack found in the Express app. Make sure it is a valid Express application."
    );
    console.error("App structure:", Object.keys(app));
    return [];
  }

  // Process the stack to extract routes
  processStack(stack, "", routes);

  return routes;
}

/**
 * Process the router stack recursively to extract routes
 * @param {Array} stack - Router stack
 * @param {string} basePath - Base path for the current stack
 * @param {Array} routes - Array to collect route objects
 */
function processStack(stack, basePath, routes) {
  if (!Array.isArray(stack)) {
    console.error("Invalid router stack provided");
    return;
  }

  // Helper function to add a route, combining methods if the path already exists
  const addRoute = (path, method, middleware) => {
    // Normalize path by removing trailing slash if it's not the root path
    const normalizedPath = path === "/" ? path : path.replace(/\/$/, "");

    // Check if this path already exists in the routes
    const existingRoute = routes.find((r) => r.path === normalizedPath);

    if (existingRoute) {
      // Add the method if it doesn't already exist
      if (!existingRoute.methods.includes(method)) {
        existingRoute.methods.push(method);
      }
      // Add middleware if it doesn't already exist
      middleware.forEach((m) => {
        if (!existingRoute.middleware.includes(m)) {
          existingRoute.middleware.push(m);
        }
      });
    } else {
      // Add a new route
      routes.push({
        methods: [method],
        path: normalizedPath,
        middleware: middleware
      });
    }
  };

  stack.forEach((layer) => {
    if (layer.route) {
      // This is a route layer
      const path = basePath + (layer.route.path || "");

      // Handle methods
      if (layer.route.methods) {
        // Collect all methods for this route
        const methods = Object.keys(layer.route.methods)
          .filter((method) => layer.route.methods[method])
          .map((method) => method.toUpperCase());

        // Add each method as a separate route
        methods.forEach((method) => {
          addRoute(
            path,
            method,
            layer.route.stack ? layer.route.stack.map((handler) => handler.name || "anonymous") : []
          );
        });
      } else if (layer.route.method) {
        // Some Express versions use a single method property
        addRoute(
          path,
          layer.route.method.toUpperCase(),
          layer.route.stack ? layer.route.stack.map((handler) => handler.name || "anonymous") : []
        );
      }
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      // This is a router middleware
      // Extract the path from the layer's regexp
      let routerPath = basePath;

      if (layer.regexp) {
        try {
          // Improved regex path extraction
          if (layer.regexp.source !== "^\\/(?=\\/|$)") {
            // Get the original path if available
            if (layer.path) {
              routerPath = basePath + layer.path;
            } else {
              // Try to extract from regex
              let regexPath = layer.regexp.toString();

              // Clean up common Express regex patterns
              regexPath = regexPath
                .replace(/^\/\^\\\//, "/") // Remove start of regex
                .replace(/\\\/\?\(\?=\\\/\|\$\)/g, "") // Remove ?(?=/|$) pattern
                .replace(/\\\//g, "/") // Replace \/ with /
                .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":param") // Replace param patterns
                .replace(/\(\[\^\\\/\]\+\?\)/g, ":param") // Replace simpler param patterns
                .replace(/\\/g, "") // Remove remaining backslashes
                .replace(/\(\.\*\)/g, "*") // Replace (.*) with *
                .replace(/\?\(.*?\)/g, "") // Remove optional groups
                .replace(/\/i$/, "") // Remove end of regex
                .replace(/\/\//g, "/"); // Replace double slashes

              routerPath = basePath + regexPath;
            }
          }
        } catch (_) {
          // If regex extraction fails, try to use the path property if available
          if (layer.path) {
            routerPath = basePath + layer.path;
          }
        }
      } else if (layer.path) {
        routerPath = basePath + layer.path;
      }

      // Ensure routerPath doesn't have a trailing slash unless it's the root path
      if (routerPath !== "/" && routerPath.endsWith("/")) {
        routerPath = routerPath.slice(0, -1);
      }

      processStack(layer.handle.stack, routerPath, routes);
    } else if (layer.name === "bound dispatch" && layer.handle && layer.handle.stack) {
      // This is a mounted app
      let mountPath = basePath;

      if (layer.regexp) {
        try {
          // Improved regex path extraction
          if (layer.path) {
            mountPath = basePath + layer.path;
          } else {
            // Try to extract from regex
            let regexPath = layer.regexp.toString();

            // Clean up common Express regex patterns
            regexPath = regexPath
              .replace(/^\/\^\\\//, "/") // Remove start of regex
              .replace(/\\\/\?\(\?=\\\/\|\$\)/g, "") // Remove ?(?=/|$) pattern
              .replace(/\\\//g, "/") // Replace \/ with /
              .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":param") // Replace param patterns
              .replace(/\(\[\^\\\/\]\+\?\)/g, ":param") // Replace simpler param patterns
              .replace(/\\/g, "") // Remove remaining backslashes
              .replace(/\(\.\*\)/g, "*") // Replace (.*) with *
              .replace(/\?\(.*?\)/g, "") // Remove optional groups
              .replace(/\/i$/, "") // Remove end of regex
              .replace(/\/\//g, "/"); // Replace double slashes

            mountPath = basePath + regexPath;
          }
        } catch (_) {
          // If regex extraction fails, try to use the path property if available
          if (layer.path) {
            mountPath = basePath + layer.path;
          }
        }
      } else if (layer.path) {
        mountPath = basePath + layer.path;
      }

      processStack(layer.handle.stack, mountPath, routes);
    } else if (
      layer.handle &&
      typeof layer.handle === "function" &&
      layer.handle.name === "router"
    ) {
      // This might be a router in a different format
      if (layer.handle.stack) {
        let routerPath = basePath;
        if (layer.regexp) {
          try {
            // Improved regex path extraction
            if (layer.path) {
              routerPath = basePath + layer.path;
            } else {
              // Try to extract from regex
              let regexPath = layer.regexp.toString();

              // Clean up common Express regex patterns
              regexPath = regexPath
                .replace(/^\/\^\\\//, "/") // Remove start of regex
                .replace(/\\\/\?\(\?=\\\/\|\$\)/g, "") // Remove ?(?=/|$) pattern
                .replace(/\\\//g, "/") // Replace \/ with /
                .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":param") // Replace param patterns
                .replace(/\(\[\^\\\/\]\+\?\)/g, ":param") // Replace simpler param patterns
                .replace(/\\/g, "") // Remove remaining backslashes
                .replace(/\(\.\*\)/g, "*") // Replace (.*) with *
                .replace(/\?\(.*?\)/g, "") // Remove optional groups
                .replace(/\/i$/, "") // Remove end of regex
                .replace(/\/\//g, "/"); // Replace double slashes

              routerPath = basePath + regexPath;
            }
          } catch (_) {
            // Fallback to path property
            if (layer.path) {
              routerPath = basePath + layer.path;
            }
          }
        } else if (layer.path) {
          routerPath = basePath + layer.path;
        }

        processStack(layer.handle.stack, routerPath, routes);
      }
    }
  });
}

module.exports = {
  extractRoutesFromApp,
  processStack
};
