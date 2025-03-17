/**
 * Web Diagram Visualization for Express Router Diagram
 * This module contains functions for setting up web-based route visualizations using D3
 */

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { extractRoutesFromApp } = require("./extractRoutes");

/**
 * Set up a web route for visualizing routes
 * @param {Object} app - Express app
 * @param {Array} routes - Array of route objects
 * @param {string} webRoutePath - Custom route path for the web visualization (default: "/express-routes")
 */
function setupWebRoute(app, routes, webRoutePath = "/express-routes") {
	// Ensure webRoute has a leading slash
	const webRoute = webRoutePath && !webRoutePath.startsWith("/") 
		? `/${webRoutePath}` 
		: webRoutePath;

	// Set up static file serving for assets
	const publicDir = path.join(__dirname, "..", "public");
	if (fs.existsSync(publicDir)) {
		// Serve the entire public directory
		app.use(express.static(publicDir));
		console.log("Serving static files from:", publicDir);
	} else {
		console.error("Public directory not found at:", publicDir);
	}

	// Derive the data route path from the web route
	const dataRoutePath = `${webRoute}-data`;

	// Add a JSON API endpoint for routes data
	app.get(dataRoutePath, (_, res) => {
		console.log(`Express routes data requested at: ${dataRoutePath}`);
		res.json(routes);
	});

	// Add the route handler for the D3 visualization
	app.get(webRoute, (_, res) => {
		console.log(`Express routes D3 visualization requested at: ${webRoute}`);

		try {
			// Path to the D3 HTML template
			const templatePath = path.join(
				__dirname,
				"..",
				"views",
				"d3-diagram.html",
			);

			// Check if the template exists
			if (!fs.existsSync(templatePath)) {
				console.error("D3 diagram template file not found at:", templatePath);
				return res
					.status(500)
					.send(
						"D3 diagram template file not found. Make sure the views directory is properly set up.",
					);
			}

			// Serve the HTML file directly
			res.sendFile(templatePath);
		} catch (error) {
			console.error("Error in D3 visualization:", error);
			res
				.status(500)
				.send("Error generating D3 visualization: ", error.message);
		}
	});

	console.log(`Express routes visualization available at: ${webRoute}`);
	console.log(`Express routes data API available at: ${dataRoutePath}`);
}

/**
 * Function to generate routes immediately when server starts
 * @param {Object} app - Express app
 * @returns {Array} Array of routes
 */
function generateRoutesOnStartup(app) {
	const routes = extractRoutesFromApp(app);
	console.log(
		`Generated ${routes.length} routes for web visualization on startup`,
	);
	return routes;
}

module.exports = {
	setupWebRoute,
	generateRoutesOnStartup,
};
