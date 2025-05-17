import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hash } from "./auth";
import { testSupabaseConnection, listSupabaseTables } from "./supabase";
import { testDatabaseConnection } from "./db";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { sendEmail } from "./mailer";

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
  
  // Forgot password route
  app.post("/api/forgot-password", async (req, res) => {
    try {
      // Validate the request body
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data", 
          errors: validation.error.format() 
        });
      }
      
      const { email } = validation.data;
      
      // Create a password reset token
      const token = await storage.createPasswordResetToken(email);
      
      // If no token was created, it means no user was found with that email
      // We don't want to reveal this to the client for security reasons
      if (!token) {
        // Still return success to prevent email enumeration attacks
        return res.json({ 
          success: true, 
          message: "If your email is in our system, you will receive a password reset link" 
        });
      }
      
      // Create the reset link
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
      
      // Send the password reset email
      const emailResult = await sendEmail({
        to: email,
        subject: "Password Reset Request",
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset for your account.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
        text: `
          Password Reset
          
          You requested a password reset for your account.
          
          Please visit the following link to reset your password:
          ${resetLink}
          
          If you didn't request this, you can ignore this email.
          
          This link will expire in 1 hour.
        `
      });
      
      if (!emailResult.success) {
        console.error("Failed to send password reset email");
      } else {
        console.log("Password reset email sent", emailResult.previewUrl ? `Preview: ${emailResult.previewUrl}` : '');
      }
      
      // Return success even if email failed for security
      res.json({ 
        success: true, 
        message: "If your email is in our system, you will receive a password reset link" 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred processing your request" 
      });
    }
  });
  
  // Verify reset token route
  app.get("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or missing token" 
        });
      }
      
      // Verify the token is valid
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }
      
      // Token is valid
      res.json({ 
        success: true, 
        message: "Token is valid" 
      });
    } catch (error) {
      console.error("Reset token verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred verifying your reset token" 
      });
    }
  });
  
  // Reset password route
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or missing token" 
        });
      }
      
      // Validate the request body
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data", 
          errors: validation.error.format() 
        });
      }
      
      const { password } = validation.data;
      
      // Hash the new password
      const hashedPassword = hash(password);
      
      // Reset the password
      const success = await storage.resetPassword(token, hashedPassword);
      
      if (!success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Password reset successful. You can now log in with your new password." 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred resetting your password" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}