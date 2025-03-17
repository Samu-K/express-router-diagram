import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import routerDiagram, { printAppRoutes } from "../../src/index";

describe("routerDiagram middleware", () => {
  let app;
  let consoleLogSpy;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();

    // Set up some routes
    app.get("/", (_, res) => res.send("Home"));
    app.get("/api/users", (_, res) => res.json({ users: [] }));
    app.post("/api/users", (_, res) => res.json({ success: true }));

    // Spy on console.log without mocking its implementation
    consoleLogSpy = vi.spyOn(console, "log");
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it("should not interfere with normal route handling", async () => {
    // Add the middleware
    app.use(routerDiagram());

    // Test the home route
    const homeResponse = await request(app).get("/");
    expect(homeResponse.status).toBe(200);
    expect(homeResponse.text).toBe("Home");

    // Test the API route
    const apiResponse = await request(app).get("/api/users");
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body).toEqual({ users: [] });
  });

  it("should log routes to console when printAppRoutes is called", async () => {
    // Add the middleware
    app.use(routerDiagram({ logToConsole: true }));

    // Make a request to trigger the middleware
    await request(app).get("/");
    printAppRoutes(app);

    // The middleware should have called console.log at least once
    expect(consoleLogSpy).toHaveBeenCalled();

    // We don't check for a specific message since the middleware logs a hierarchical diagram
    // which can vary based on the routes
  });

  it("should not log routes to console when logToConsole is false", async () => {
    // Add the middleware with logToConsole option set to false
    app.use(routerDiagram({ logToConsole: false }));

    // Make a request to trigger the middleware
    await request(app).get("/");

    // Verify that console.log was not called with the header text
    expect(consoleLogSpy).not.toHaveBeenCalledWith("\n\x1b[1m\x1b[36mEXPRESS ROUTES\x1b[0m");
  });

  it("should add the /express-routes endpoint when generateWeb is true", async () => {
    // Add the middleware with generateWeb option
    app.use(routerDiagram({ generateWeb: true }));

    // Test the express-routes endpoint
    const response = await request(app).get("/express-routes");
    expect(response.status).toBe(200);
    expect(response.text).toContain("<!DOCTYPE html>");
    expect(response.text).toContain("Express Routes Flow Diagram");
  });

  it("should add the /express-routes-data endpoint when generateWeb is true", async () => {
    // Add the middleware with generateWeb option
    app.use(routerDiagram({ generateWeb: true }));

    // Test the express-routes-data endpoint
    const response = await request(app).get("/express-routes-data");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);

    // Check that the routes data is correct
    expect(response.body).toContainEqual(
      expect.objectContaining({
        path: "/",
        methods: expect.arrayContaining(["GET"])
      })
    );

    expect(response.body).toContainEqual(
      expect.objectContaining({
        path: "/api/users",
        methods: expect.arrayContaining(["GET", "POST"])
      })
    );
  });

  it("should exclude routes matching patterns in excludePatterns", async () => {
    // Add the middleware with excludePatterns option
    app.use(
      routerDiagram({
        generateWeb: true,
        excludePatterns: ["/api"]
      })
    );

    // Test the express-routes-data endpoint
    const response = await request(app).get("/express-routes-data");
    expect(response.status).toBe(200);

    // Check that API routes are excluded
    const apiRoutes = response.body.filter((route) => route.path.startsWith("/api"));
    expect(apiRoutes.length).toBe(0);

    // Check that non-API routes are included
    const nonApiRoutes = response.body.filter((route) => !route.path.startsWith("/api"));
    expect(nonApiRoutes.length).toBeGreaterThan(0);
  });
});
