import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { testSupabaseConnection, listSupabaseTables } from "./supabase";
import { testDatabaseConnection } from "./db";

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Protected route example
  app.get("/api/protected", isAuthenticated, (req: Request, res) => {
    if (req.user) {
      res.json({
        message: "This is protected data",
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : null
        }
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
  
  // Test database connection route
  app.get("/api/database-test", async (req, res) => {
    try {
      const isConnected = await testDatabaseConnection();
      
      if (isConnected) {
        res.json({ 
          success: true, 
          message: "Successfully connected to Supabase PostgreSQL database",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to connect to Supabase PostgreSQL database" 
        });
      }
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error testing database connection",
        error: String(error)
      });
    }
  });
  
  // Test Supabase connection route
  app.get("/api/supabase-test", async (req, res) => {
    try {
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        res.json({ 
          success: true, 
          message: "Successfully connected to Supabase",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to connect to Supabase" 
        });
      }
    } catch (error) {
      console.error("Supabase test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error testing Supabase connection",
        error: String(error)
      });
    }
  });
  
  // List Supabase tables route
  app.get("/api/supabase-tables", async (req, res) => {
    try {
      const tables = await listSupabaseTables();
      res.json({
        success: true,
        tables
      });
    } catch (error) {
      console.error("Error listing tables:", error);
      res.status(500).json({
        success: false,
        message: "Failed to list Supabase tables",
        error: String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}