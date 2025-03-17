// global-setup.js
import { chromium } from "@playwright/test";

/**
 * Global setup for Playwright tests
 * This ensures the server is ready before tests start
 */
async function globalSetup() {
	// Launch a browser and try to connect to the server
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Wait for the server to be ready
	let retries = 5;
	while (retries > 0) {
		try {
			console.log("Checking if server is ready...");
			await page.goto("http://localhost:3000/express-routes");
			console.log("Server is ready!");
			break;
		} catch (error) {
			console.log(
				`Server not ready yet, retrying... (${retries} attempts left)`,
			);
			retries--;
			if (retries === 0) {
				console.error("Server failed to start in time");
				throw error;
			}
			// Wait 2 seconds before retrying
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	await browser.close();
}

export default globalSetup;
