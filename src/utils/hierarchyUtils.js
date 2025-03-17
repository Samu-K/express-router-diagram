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

			// Build the hierarchy
			for (let i = 0; i < segments.length; i++) {
				const segment = segments[i];
				const isLastSegment = i === segments.length - 1;

				// Handle path parameters (e.g., :userId)
				const isParam = segment.startsWith(":");

				if (isLastSegment) {
					// This is the last segment, add the route here
					if (!current[segment]) {
						current[segment] = [];
					}

					// Ensure it's an array
					if (!Array.isArray(current[segment])) {
						// If it's an object with nested routes, add a routes property
						if (typeof current[segment] === "object") {
							if (!current[segment].routes) {
								current[segment].routes = [];
							}
							current[segment].routes.push(route);
						} else {
							// Convert to array if it's not already
							current[segment] = [route];
						}
					} else {
						// It's already an array, just push the route
						current[segment].push(route);
					}
				} else {
					// This is not the last segment, create a new level in the hierarchy
					if (!current[segment]) {
						current[segment] = {};
					}

					// Special handling for path parameters
					if (isParam) {
						// For path parameters, we need to create an array of objects
						// Each object represents a possible value for the parameter
						if (!Array.isArray(current[segment])) {
							// Convert to array if it's not already
							const temp = current[segment];
							current[segment] = [{}];

							// If there were existing properties, copy them to the first item in the array
							if (typeof temp === "object" && Object.keys(temp).length > 0) {
								current[segment][0] = { ...temp };
							}
						} else if (current[segment].length === 0) {
							// If it's an empty array, add an object
							current[segment].push({});
						}

						// Move to the first item in the array
						current = current[segment][0];
					} else {
						// Move to the next level in the hierarchy
						current = current[segment];
					}
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

		// Handle different types of values
		if (Array.isArray(value)) {
			// This could be an array of routes or a mixed array

			// Check if this is an array of route objects
			const routeItems = value.filter(
				(item) => item && item.path && item.methods,
			);

			if (routeItems.length > 0) {
				// Extract methods from routes
				const methods = new Set();
				routeItems.forEach((route) => {
					if (route.methods && Array.isArray(route.methods)) {
						route.methods.forEach((method) => methods.add(method));
					}
				});

				// Print the key with methods
				if (methods.size > 0) {
					const methodsArray = Array.from(methods).sort();
					if (useColors) {
						result += `${linePrefix}${key} [${colorUtils.colorizeMethodsString(methodsArray)}]\n`;
					} else {
						result += `${linePrefix}${key} [${methodsArray.join(", ")}]\n`;
					}
				} else {
					result += `${linePrefix}${key}\n`;
				}
			} else {
				// This is a mixed array with both objects and routes
				result += `${linePrefix}${key}\n`;

				// Get all string keys from the array
				const childKeys = [];
				value.forEach((item) => {
					if (item && typeof item === "object") {
						Object.keys(item).forEach((itemKey) => {
							if (
								typeof itemKey === "string" &&
								!itemKey.startsWith("_") &&
								itemKey !== "path" &&
								itemKey !== "methods" &&
								itemKey !== "middleware" &&
								!childKeys.includes(itemKey)
							) {
								childKeys.push(itemKey);
							}
						});
					}
				});

				// Process each child key
				childKeys.forEach((childKey, childIndex) => {
					const isLastChild = childIndex === childKeys.length - 1;
					const childPrefix = this.getChildPrefix(level, isLastChild);

					// Find the item with this key
					const childItem = value.find((item) => item && item[childKey]);
					if (childItem) {
						result += this.processHierarchyNode(
							childKey,
							childItem[childKey],
							level + 1,
							isLastChild,
							{
								...options,
								childPrefix,
							},
						);
					}
				});
			}
		} else if (typeof value === "object" && value !== null) {
			// Check if it's a route object
			if (value.path && value.methods) {
				// This is a route object
				const methods = Array.isArray(value.methods) ? value.methods : [];
				if (methods.length > 0) {
					if (useColors) {
						result += `${linePrefix}${key} [${colorUtils.colorizeMethodsString(methods)}]\n`;
					} else {
						result += `${linePrefix}${key} [${methods.join(", ")}]\n`;
					}
				} else {
					result += `${linePrefix}${key}\n`;
				}
			} else {
				// This is a branch node
				result += `${linePrefix}${key}\n`;

				// Get child keys
				const childKeys = Object.keys(value).filter(
					(childKey) =>
						typeof childKey === "string" &&
						!childKey.startsWith("_") &&
						childKey !== "path" &&
						childKey !== "methods" &&
						childKey !== "middleware",
				);

				// Process each child
				childKeys.forEach((childKey, childIndex) => {
					const isLastChild = childIndex === childKeys.length - 1;
					const childPrefix = this.getChildPrefix(level, isLastChild);

					result += this.processHierarchyNode(
						childKey,
						value[childKey],
						level + 1,
						isLastChild,
						{
							...options,
							childPrefix,
						},
					);
				});
			}
		} else {
			// Just print the key for other types
			result += `${linePrefix}${key}\n`;
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

		// Extract useColors option
		const useColors = options.useColors === true;

		// Handle empty hierarchy
		if (!hierarchy) {
			return result;
		}

		// Special case for the root level (api)
		if (level === 0 && hierarchy.api) {
			// Start with the api key
			result += "api\n";

			// Process the api contents
			const apiContents = hierarchy.api;

			// First, handle any route objects directly in the array
			if (Array.isArray(apiContents)) {
				const routeItems = apiContents.filter(
					(item) => item && item.path && item.methods,
				);
				if (routeItems.length > 0) {
					// Pass the useColors option to processHierarchyNode
					result += this.processHierarchyNode("", routeItems, 1, true, {
						useColors,
					});
				}
			} else if (typeof apiContents === "object") {
				// Get all keys except special ones
				const keys = Object.keys(apiContents).filter(
					(key) => key !== "_routes" && key !== "_methods",
				);

				// Process each key
				keys.forEach((key, index) => {
					const isLast = index === keys.length - 1;
					// Pass the useColors option to processHierarchyNode
					result += this.processHierarchyNode(
						key,
						apiContents[key],
						1,
						isLast,
						{ useColors },
					);
				});
			}

			return result;
		}

		// For non-root levels, process normally
		const keys = Object.keys(hierarchy).filter(
			(key) =>
				typeof key === "string" &&
				!key.startsWith("_") &&
				key !== "path" &&
				key !== "methods" &&
				key !== "middleware",
		);

		keys.forEach((key, index) => {
			const isLast = index === keys.length - 1;
			const value = hierarchy[key];

			result += this.processHierarchyNode(key, value, level, isLast, {
				useColors,
			});
		});

		return result;
	},
};

module.exports = {
	organizeRoutesHierarchy:
		hierarchyUtils.organizeRoutesHierarchy.bind(hierarchyUtils),
	printHierarchyToString:
		hierarchyUtils.printHierarchyToString.bind(hierarchyUtils),
	processHierarchyNode:
		hierarchyUtils.processHierarchyNode.bind(hierarchyUtils),
	getLinePrefix: hierarchyUtils.getLinePrefix.bind(hierarchyUtils),
	getChildPrefix: hierarchyUtils.getChildPrefix.bind(hierarchyUtils),
};
