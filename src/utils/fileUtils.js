/**
 * Utilities for file operations
 */

const fs = require("node:fs");
const path = require("node:path");

const fileUtils = {
	/**
	 * Saves a diagram to a file
	 * @param {string} diagram - The diagram content
	 * @param {string} outputPath - Path to save the diagram
	 */
	saveDiagram(diagram, outputPath) {
		try {
			fs.writeFileSync(path.resolve(outputPath), diagram, "utf8");
			console.log(`Diagram saved to ${outputPath}`);
		} catch (error) {
			console.error(`Error saving diagram: ${error.message}`);
		}
	},
};

module.exports = {
	saveDiagram: fileUtils.saveDiagram,
};
