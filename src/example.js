/**
 * Express Router Diagram Example
 *
 * This example demonstrates how to use express-router-diagram
 * to visualize your Express.js routes.
 */

const express = require("express");
const routerDiagram = require("./index"); // Use './index' for local testing, 'express-router-diagram' when installed from npm

// Create an Express app
const app = express();

// Define some example routes
app.get("/", (_, res) => {
  res.send("Hello World!");
});

// User routes
app.get("/api/users", (_, res) => {
  res.json({ users: [] });
});

app.post("/api/users", (_, res) => {
  res.json({ success: true });
});

app.get("/api/users/:id", (req, res) => {
  res.json({ user: { id: req.params.id } });
});

app.put("/api/users/:id", (_, res) => {
  res.json({ success: true });
});

app.delete("/api/users/:id", (_, res) => {
  res.json({ success: true });
});

// Post routes
app.get("/api/posts", (_, res) => {
  res.json({ posts: [] });
});

app.post("/api/posts", (_, res) => {
  res.json({ success: true });
});

app.get("/api/posts/:id", (req, res) => {
  res.json({ post: { id: req.params.id } });
});

// Nested routes
app.get("/api/users/:userId/posts", (_, res) => {
  res.json({ posts: [] });
});

app.get("/api/users/:userId/profile", (_, res) => {
  res.json({ profile: {} });
});

// Add the router diagram middleware
app.use(
  routerDiagram({
    generateWeb: true, // Enable web visualization
    logToConsole: false // Disable automatic console logging
  })
);

// Start the server if this file is run directly
if (require.main === module) {
  // Explicitly print routes only when run directly
  routerDiagram.printAppRoutes(app);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
    console.log(`View the route diagram at http://localhost:${PORT}/express-routes`);
  });
}

// Export the app for use with the CLI
module.exports = app;
