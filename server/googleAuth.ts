import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Handle Google authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, displayName, uid, photoURL } = req.body;
      
      console.log("Google authentication attempt for:", email);
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create a new user with Google credentials
        console.log("Creating new user from Google auth:", email);
        
        // Generate a username from email (before the @ symbol)
        const username = email.split('@')[0];
        
        // Check if username exists
        const existingUserWithUsername = await storage.getUserByUsername(username);
        
        // If username exists, append a random number
        const finalUsername = existingUserWithUsername 
          ? `${username}${Math.floor(Math.random() * 10000)}`
          : username;
        
        // Create the user with a special password for Google users
        user = await storage.createUser({
          username: finalUsername,
          email: email,
          password: `google-auth-${uid}`, // Special password format for Google users
          firstName: displayName ? displayName.split(' ')[0] : null,
          lastName: displayName && displayName.split(' ').length > 1
            ? displayName.split(' ').slice(1).join(' ') 
            : null,
          profileImageUrl: photoURL || null,
        });
        
        console.log(`New Google user created with id: ${user.id}`);
      } else {
        console.log(`Existing user found with email: ${email}`);
        
        // Update user profile with latest Google info if needed
        if (displayName || photoURL) {
          // Here we could update the user's profile info if needed
          console.log("User profile info could be updated here");
        }
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login after Google auth failed:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Remove password before sending to client
        const { password, ...userWithoutPassword } = user;
        
        console.log("Google authentication successful, user logged in");
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Google authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });
}