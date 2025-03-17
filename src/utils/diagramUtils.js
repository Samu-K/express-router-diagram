/**
 * Utilities for generating diagrams
 */

const colorUtils = require("./colorUtils");
const hierarchyUtils = require("./hierarchyUtils");

const diagramUtils = {
	/**
	 * Generates a simple text representation of routes
	 * @param {Array} routes - Array of route objects
	 * @param {Object} options - Display options
	 * @returns {string} Text representation of routes
	 */
	generateTextDiagram(routes, options = {}) {
		let diagram = "EXPRESS ROUTES\n==============\n\n";

		// Determine if we should use colors in the output
		const useColors = options.colorOutput === true;

		if (!routes || routes.length === 0) {
			diagram += "No routes found\n";
			return diagram;
		}

		if (options.hierarchical !== false) {
			// Generate hierarchical diagram
			const hierarchy = hierarchyUtils.organizeRoutesHierarchy(routes);
			// Pass the color option to printHierarchyToString
			diagram += hierarchyUtils.printHierarchyToString(hierarchy, 0, {
				useColors,
			});
		} else {
			// Generate flat list diagram (original behavior)
			// Sort routes by path and method
			routes.sort((a, b) => {
				if (a.path === b.path) {
					const aMethod = a.methods && a.methods.length > 0 ? a.methods[0] : "";
					const bMethod = b.methods && b.methods.length > 0 ? b.methods[0] : "";
					return aMethod.localeCompare(bMethod);
				}
				return a.path.localeCompare(b.path);
			});

			routes.forEach((route) => {
				// Only show method and path, no middleware or file information
				const methods =
					route.methods && route.methods.length > 0
						? route.methods.join(", ")
						: "UNKNOWN";

				// Apply colors only if specified
				if (useColors) {
					diagram += `[${colorUtils.colorizeMethods(methods)}] ${route.path}\n`;
				} else {
					diagram += `[${methods}] ${route.path}\n`;
				}
			});
		}

		diagram += `\nTotal routes: ${routes.length}\n`;

		return diagram;
	},
};

module.exports = {
	generateTextDiagram: diagramUtils.generateTextDiagram,
};
