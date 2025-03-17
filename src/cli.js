#!/usr/bin/env node

/**
 * Command-line interface for express-router-diagram
 */

const path = require("node:path");
const routerDiagram = require("./index");

// Parse command line arguments
const args = process.argv.slice(2);
let appFile = null;
let outputFile = null;
let showHelp = false;
let startServer = false;
let serverPort = 3000;
let colorFile = false;
let diagramRoute = "express-routes"; // Default route path without leading slash

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "-h" || arg === "--help") {
    showHelp = true;
  } else if (arg === "-o" || arg === "--output") {
    outputFile = args[++i];
  } else if (arg === "-a" || arg === "--app") {
    if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
      appFile = args[++i];
    } else {
      console.error("Error: --app parameter requires a file path");
      process.exit(1);
    }
  } else if (arg === "-s" || arg === "--server") {
    startServer = true;
    if (args[i + 1] && !args[i + 1].startsWith("-")) {
      serverPort = Number.parseInt(args[++i], 10);
    }
  } else if (arg === "--color-file") {
    colorFile = true;
  } else if (arg === "--diagram-route") {
    if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
      diagramRoute = args[++i];
      // Remove leading slash if present (will be added back by the middleware)
      if (diagramRoute.startsWith("/")) {
        diagramRoute = diagramRoute.substring(1);
      }
    } else {
      console.error("Error: --diagram-route parameter requires a route path");
      process.exit(1);
    }
  }
}

// Show help
if (showHelp || !appFile) {
  console.log(`
Express Router Diagram - CLI

Usage: express-router-diagram [options]

Options:
  -a, --app <file>         Express application module to analyze (required)
  -o, --output <file>      Output file (default: stdout)
  -s, --server [port]      Start a web server to visualize routes (default port: 3000)
  --color-file             Include ANSI color codes in the output file (default: no colors)
  --diagram-route <path>   Custom route path for the web visualization (default: express-routes)
                           Note: Do not include a leading slash, it will be added automatically
  -h, --help               Show this help message

Examples:
  express-router-diagram --app ./app.js
  express-router-diagram --app ./app.js --output routes-diagram.txt
  express-router-diagram --app ./app.js --output routes-diagram.txt --color-file
  express-router-diagram --app ./app.js --server 8080
  express-router-diagram --app ./app.js --server 8080 --diagram-route routes/diagram

Note: You can also use express-router-diagram as middleware in your Express app:
  const routerDiagram = require('express-router-diagram');
  app.use(routerDiagram({ generateWeb: true, webRoute: 'routes/diagram' }));
  `);

  // Exit with error code if --app parameter is missing and not showing help
  if (!appFile && !showHelp) {
    console.error("Error: --app parameter is required");
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Generate diagram
try {
  // Process an Express app
  const appPath = path.resolve(process.cwd(), appFile);
  console.log(`Importing Express app from: ${appPath}`);

  // Import the app
  let app;
  try {
    // Use a more robust require approach
    delete require.cache[require.resolve(appPath)];
    app = require(appPath);

    // Handle case where the app is exported as a property
    if (app && typeof app === "object" && !app._router && !app.router && !app.stack) {
      // Try common export patterns
      if (app.app && (app.app._router || app.app.router || app.app.stack)) {
        app = app.app;
      } else if (app.default && typeof app.default === "function") {
        app = app.default();
      } else {
        // Look for any property that might be an Express app
        for (const key of Object.keys(app)) {
          const potentialApp = app[key];
          if (potentialApp && (potentialApp._router || potentialApp.router || potentialApp.stack)) {
            app = potentialApp;
            break;
          }
        }
      }
    }

    // If app is a function, it might be an Express app factory
    if (typeof app === "function" && !app._router) {
      try {
        const tempApp = app();
        if (tempApp && (tempApp._router || tempApp.router || tempApp.stack)) {
          app = tempApp;
        }
      } catch (error) {
        console.error("Error initializing app:", error.message);
      }
    }
  } catch (error) {
    console.error(`Error importing app from ${appPath}:`, error.message);
    process.exit(1);
  }

  // Check if we have a valid Express app
  if (!app || (!app._router && !app.router && !app.stack)) {
    console.error(
      "Could not find a valid Express app in the specified file. Make sure it exports an Express app."
    );
    process.exit(1);
  }

  // If starting a server
  if (startServer) {
    // Create a new Express app to serve the diagram
    const express = require("express");
    const serverApp = express();

    // Extract routes from the user's app
    const routes = routerDiagram.extractRoutesFromApp(app);

    // Add the router diagram middleware with the custom route
    serverApp.use(
      routerDiagram({
        generateWeb: true,
        logToConsole: false,
        preGeneratedRoutes: routes,
        webRoute: diagramRoute
      })
    );

    // Start the server
    serverApp.listen(serverPort, () => {
      console.log(`Express Router Diagram server started on port ${serverPort}`);
      console.log(`View the route diagram at http://localhost:${serverPort}/${diagramRoute}`);
    });
  } else if (outputFile) {
    // Just output to a file
    routerDiagram.printAppRoutes(app, {
      logToConsole: false,
      outputFile,
      colorOutput: colorFile
    });
    console.log(`Routes diagram saved to: ${outputFile}`);
  } else {
    // Just print to console
    routerDiagram.printAppRoutes(app);
  }
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
