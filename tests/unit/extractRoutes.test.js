import express from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { extractRoutesFromApp } from "../../src/index";

describe("extractRoutesFromApp", () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
  });

  it("should extract routes from an Express app", () => {
    // Set up some routes
    app.get("/", () => {});
    app.post("/users", () => {});
    app.get("/users/:id", () => {});

    // Extract routes
    const routes = extractRoutesFromApp(app);

    // Verify the extracted routes
    expect(routes).toBeInstanceOf(Array);
    expect(routes.length).toBe(3);

    // Check the root route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/",
        methods: expect.arrayContaining(["GET"])
      })
    );

    // Check the /users route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/users",
        methods: expect.arrayContaining(["POST"])
      })
    );

    // Check the /users/:id route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/users/:id",
        methods: expect.arrayContaining(["GET"])
      })
    );
  });

  it("should handle routes with multiple methods", () => {
    // Set up a route with multiple methods
    app
      .route("/api/resource")
      .get(() => {})
      .post(() => {})
      .put(() => {});

    // Extract routes
    const routes = extractRoutesFromApp(app);

    // Find the /api/resource route
    const resourceRoute = routes.find((route) => route.path === "/api/resource");

    // Verify it has all three methods
    expect(resourceRoute).toBeDefined();
    expect(resourceRoute.methods).toContain("GET");
    expect(resourceRoute.methods).toContain("POST");
    expect(resourceRoute.methods).toContain("PUT");
  });

  it("should handle nested routers", () => {
    // Create a router
    const userRouter = express.Router();
    userRouter.get("/", () => {});
    userRouter.post("/", () => {});
    userRouter.get("/:id", () => {});

    // Mount the router
    app.use("/api/users", userRouter);

    // Extract routes
    const routes = extractRoutesFromApp(app);

    // Debug output to see what routes are actually extracted
    console.log("Extracted routes:", JSON.stringify(routes, null, 2));

    // Verify the extracted routes
    // The implementation correctly combines GET and POST methods for the same path
    expect(routes.length).toBe(2);

    // Check the /api/users route with both GET and POST methods
    const usersRoute = routes.find((r) => r.path === "/api/users");
    expect(usersRoute).toBeDefined();
    expect(usersRoute.methods).toContain("GET");
    expect(usersRoute.methods).toContain("POST");

    // Check the /api/users/:id route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/api/users/:id",
        methods: expect.arrayContaining(["GET"])
      })
    );
  });

  it("should handle routes with path parameters", () => {
    // Set up routes with path parameters
    app.get("/users/:userId", () => {});
    app.get("/posts/:postId/comments/:commentId", () => {});

    // Extract routes
    const routes = extractRoutesFromApp(app);

    // Verify the extracted routes
    expect(routes.length).toBe(2);

    // Check the /users/:userId route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/users/:userId",
        methods: expect.arrayContaining(["GET"])
      })
    );

    // Check the /posts/:postId/comments/:commentId route
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: "/posts/:postId/comments/:commentId",
        methods: expect.arrayContaining(["GET"])
      })
    );
  });
});
