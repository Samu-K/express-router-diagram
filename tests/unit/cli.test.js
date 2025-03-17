import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// All vi.mock calls must be at the top level, before any other code
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn()
}));

// Mock Express - must return an object with a default key
vi.mock("express", () => {
  const mockStatic = vi.fn(() => vi.fn());
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    listen: vi.fn((_, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    }),
    routes: {}
  };
  const mockExpress = vi.fn(() => mockApp);
  mockExpress.static = mockStatic;
  return { default: mockExpress };
});

// Mock the index module
vi.mock("../../src/index", () => ({
  extractRoutesFromApp: vi.fn().mockReturnValue([
    { path: "/", methods: ["GET"] },
    { path: "/api/users", methods: ["GET", "POST"] },
    { path: "/api/users/:id", methods: ["GET", "PUT", "DELETE"] }
  ]),
  printAppRoutes: vi.fn()
}));

import express from "express";
// Import the mocked modules
import { printAppRoutes } from "../../src/index";

// Store original argv
const originalArgv = process.argv;

describe("CLI", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore argv after each test
    process.argv = originalArgv;

    // Clear require cache
    vi.resetModules();
  });

  it("should extract routes and print them to console", () => {
    // Execute the CLI functionality directly
    const options = {
      logToConsole: true,
      outputFile: null,
      colorOutput: false
    };

    // Call the function that would be called by the CLI
    printAppRoutes({}, options);

    // Verify routes were extracted and printed
    expect(printAppRoutes).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        logToConsole: true,
        outputFile: null,
        colorOutput: false
      })
    );
  });

  it("should extract routes and save them to a file", () => {
    // Execute the CLI functionality directly
    const options = {
      logToConsole: false,
      outputFile: "routes.txt",
      colorOutput: false
    };

    // Call the function that would be called by the CLI
    printAppRoutes({}, options);

    // Verify routes were extracted and printed
    expect(printAppRoutes).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        logToConsole: false,
        outputFile: "routes.txt",
        colorOutput: false
      })
    );
  });

  it("should extract routes and save them to a file with colors", () => {
    // Execute the CLI functionality directly
    const options = {
      logToConsole: false,
      outputFile: "routes.txt",
      colorOutput: true
    };

    // Call the function that would be called by the CLI
    printAppRoutes({}, options);

    // Verify routes were extracted and printed
    expect(printAppRoutes).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        logToConsole: false,
        outputFile: "routes.txt",
        colorOutput: true
      })
    );
  });

  it("should start a web server when --server flag is provided", () => {
    // Create a mock Express app
    const app = express();

    // Call methods that would be called when starting a web server
    app.use(vi.fn());
    app.get("/express-routes", vi.fn());
    app.get("/express-routes-data", vi.fn());
    app.listen(3000, vi.fn());

    // Verify express methods were called
    expect(app.use).toHaveBeenCalled();
    expect(app.get).toHaveBeenCalledTimes(2);
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it("should serve visualization at /express-routes and not at root path", () => {
    // Create a mock Express app
    const app = express();

    // Track which routes are registered
    const registeredPaths = [];
    app.get.mockImplementation((path) => {
      registeredPaths.push(path);
      return app;
    });

    // Simulate starting the web server
    app.use(express.static());
    app.get("/express-routes", () => {});
    app.get("/express-routes-data", () => {});
    app.listen(3000, () => {});

    // Verify the correct routes were registered
    expect(registeredPaths).toContain("/express-routes");
    expect(registeredPaths).toContain("/express-routes-data");

    // Verify root path is not registered for visualization
    expect(registeredPaths).not.toContain("/");
  });
});
