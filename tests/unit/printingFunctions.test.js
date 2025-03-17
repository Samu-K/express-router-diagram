import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";

// Mock the dependencies before importing the module under test
vi.mock("../../src/utils/filterUtils", () => {
  const filterRoutes = vi.fn((routes) => routes || []);
  return {
    filterRoutes,
    default: { filterRoutes }
  };
});

vi.mock("../../src/utils/colorUtils", () => {
  const colors = {
    reset: "reset-code",
    bright: "bright-code",
    cyan: "cyan-code"
  };
  const colorizeMethods = vi.fn((methods) => `Colored ${methods}`);
  const colorizeMethodsString = vi.fn((methods) => `ColorizedString ${methods}`);

  return {
    colors,
    colorizeMethods,
    colorizeMethodsString,
    default: { colors, colorizeMethods, colorizeMethodsString }
  };
});

// Mock other required modules
vi.mock("../../src/utils/diagramUtils", () => {
  const generateTextDiagram = vi.fn(() => "Mock diagram");
  const saveDiagram = vi.fn();

  return {
    generateTextDiagram,
    saveDiagram,
    default: { generateTextDiagram, saveDiagram }
  };
});

vi.mock("../../src/utils/hierarchyUtils", () => {
  const organizeRoutesHierarchy = vi.fn(() => ({}));
  const printHierarchyToString = vi.fn(() => "Mock hierarchy");

  return {
    organizeRoutesHierarchy,
    printHierarchyToString,
    default: { organizeRoutesHierarchy, printHierarchyToString }
  };
});

vi.mock("../../src/utils/fileUtils", () => {
  const saveToFile = vi.fn();

  return {
    saveToFile,
    default: { saveToFile }
  };
});

// Import the actual extractRoutesFromApp function
import { extractRoutesFromApp } from "../../src/index";

// Import the mocked modules
import filterUtils from "../../src/utils/filterUtils";

// Import the module under test after mocking dependencies
import * as printingFunctions from "../../src/utils/printingFunctions";

describe("printingFunctions", () => {
  // Sample routes for testing
  const sampleRoutes = [
    { path: "/api/users", methods: ["GET", "POST"] },
    { path: "/api/posts", methods: ["GET"] }
  ];

  // Mock console methods
  let consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock console methods for each test
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  describe("printRoutes", () => {
    it("should log a message when no routes are provided", () => {
      // Override the mock for this specific test
      filterUtils.filterRoutes.mockReturnValueOnce([]);

      printingFunctions.printRoutes([]);
      expect(consoleLogSpy).toHaveBeenCalledWith("No routes found");
    });

    it("should handle null routes gracefully", () => {
      // Override the mock for this specific test
      filterUtils.filterRoutes.mockReturnValueOnce([]);

      printingFunctions.printRoutes(null);
      expect(consoleLogSpy).toHaveBeenCalledWith("No routes found");
    });

    it("should log a diagram for valid routes", () => {
      // Ensure filterUtils returns routes for this test
      filterUtils.filterRoutes.mockReturnValueOnce([...sampleRoutes]);

      printingFunctions.printRoutes(sampleRoutes);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("printAppRoutes", () => {
    // Create a real Express app with routes
    let app;
    let expectedRoutes;

    beforeEach(() => {
      app = express();

      // Add some routes to the app
      app.get("/", () => {});
      app.post("/users", () => {});
      app.get("/users/:id", () => {});

      // Define the expected routes based on what the Express app has
      expectedRoutes = [
        { path: "/", methods: ["GET"], middleware: ["<anonymous>"] },
        { path: "/users", methods: ["POST"], middleware: ["<anonymous>"] },
        { path: "/users/:id", methods: ["GET"], middleware: ["<anonymous>"] }
      ];
    });

    it("should log header when logToConsole is true", () => {
      // Pass through the actual routes
      filterUtils.filterRoutes.mockImplementation((routes) => routes);

      printingFunctions.printAppRoutes(app, { logToConsole: true }, extractRoutesFromApp);

      // Check that the header was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("EXPRESS ROUTES"));
    });

    it("should not log to console when logToConsole is false", () => {
      // Pass through the actual routes
      filterUtils.filterRoutes.mockImplementation((routes) => routes);

      printingFunctions.printAppRoutes(app, { logToConsole: false }, extractRoutesFromApp);

      // Should not call console.log for the header
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining("EXPRESS ROUTES"));
    });

    it("should return the routes array", () => {
      // Pass through the actual routes
      filterUtils.filterRoutes.mockImplementation((routes) => routes);

      const result = printingFunctions.printAppRoutes(app, {}, extractRoutesFromApp);

      // Check that the result contains the expected routes
      expect(result).toHaveLength(expectedRoutes.length);

      // Check each route individually to make the test more robust
      expectedRoutes.forEach((expectedRoute) => {
        expect(result).toContainEqual(
          expect.objectContaining({
            path: expectedRoute.path,
            methods: expect.arrayContaining(expectedRoute.methods)
          })
        );
      });
    });
  });

  describe("printRoutesInMiddleware", () => {
    beforeEach(() => {
      // Mock process.env for test environment detection
      vi.stubGlobal("process", {
        ...process,
        env: { NODE_ENV: "test" }
      });
    });

    afterEach(() => {
      // Restore process global
      vi.unstubAllGlobals();
    });

    it("should print header and footer", () => {
      printingFunctions.printRoutesInMiddleware(sampleRoutes, {});

      // Check that console.log was called with header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("EXPRESS ROUTES"));
    });

    it("should print simplified output in test environment", () => {
      printingFunctions.printRoutesInMiddleware(sampleRoutes, {});

      // Check that it logs the simplified message in test env
      expect(consoleLogSpy).toHaveBeenCalledWith("Hierarchical diagram (simplified for tests)");
    });

    it("should detect Vitest environment", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { VITEST: "true" }
      });

      printingFunctions.printRoutesInMiddleware(sampleRoutes, {});

      expect(consoleLogSpy).toHaveBeenCalledWith("Hierarchical diagram (simplified for tests)");
    });

    it("should detect Jest environment", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { JEST_WORKER_ID: "1" }
      });

      printingFunctions.printRoutesInMiddleware(sampleRoutes, {});

      expect(consoleLogSpy).toHaveBeenCalledWith("Hierarchical diagram (simplified for tests)");
    });
  });
});
