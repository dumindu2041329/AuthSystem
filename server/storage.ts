import { supabase } from "./supabase";
import {
  type User,
  type InsertUser,
  type UserWithPassword
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<UserWithPassword | undefined>;
  getUserByUsername(username: string): Promise<UserWithPassword | undefined>;
  getUserByEmail(email: string): Promise<UserWithPassword | undefined>;
  createUser(user: InsertUser): Promise<UserWithPassword>;
  upsertUser(user: any): Promise<void>; // For OpenID Connect
  updateUserPassword(userId: number, newPassword: string): Promise<boolean>;
  
  // Password reset operations
  createPasswordResetToken(email: string): Promise<string | null>;
  getUserByResetToken(token: string): Promise<UserWithPassword | undefined>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
}

// Supabase storage implementation
export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<UserWithPassword | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error("Error fetching user by ID:", error);
      return undefined;
    }
    
    return this.mapToUserWithPassword(data);
  }

  async getUserByUsername(username: string): Promise<UserWithPassword | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      console.log("User not found by username:", username);
      return undefined;
    }
    
    return this.mapToUserWithPassword(data);
  }
  
  async getUserByEmail(email: string): Promise<UserWithPassword | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.log("User not found by email:", email);
      return undefined;
    }
    
    return this.mapToUserWithPassword(data);
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ 
        password: newPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating user password:", error);
      return false;
    }
    
    return true;
  }

  async createUser(userData: InsertUser): Promise<UserWithPassword> {
    // Convert to Supabase format
    const supabaseUser = {
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_image_url: userData.profileImageUrl || null,
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(supabaseUser)
      .select()
      .single();
    
    if (error || !data) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error?.message || "Unknown error"}`);
    }
    
    return this.mapToUserWithPassword(data);
  }

  // For OpenID Connect integration
  async upsertUser(userData: any): Promise<void> {
    try {
      console.log("Upserting user:", userData);
      
      // Check if user exists by email
      if (userData.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single();
        
        if (existingUser) {
          // Update existing user
          await supabase
            .from('users')
            .update({
              first_name: userData.firstName || userData.first_name || existingUser.first_name,
              last_name: userData.lastName || userData.last_name || existingUser.last_name,
              profile_image_url: userData.profileImageUrl || userData.profile_image_url || existingUser.profile_image_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);
          return;
        }
      }

      // Create new user if no existing user found
      if (userData.email && !userData.username) {
        const emailUsername = userData.email.split('@')[0];
        
        await supabase
          .from('users')
          .insert({
            username: emailUsername,
            password: 'oauth-user', // OAuth users don't need passwords
            email: userData.email,
            first_name: userData.firstName || userData.first_name || null,
            last_name: userData.lastName || userData.last_name || null,
            profile_image_url: userData.profileImageUrl || userData.profile_image_url || null
          });
      }
    } catch (error) {
      console.error("Error upserting user:", error);
    }
  }
  
  // Helper to map Supabase data to our UserWithPassword type
  private mapToUserWithPassword(data: any): UserWithPassword {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      resetToken: data.reset_token,
      resetTokenExpiry: data.reset_token_expiry ? new Date(data.reset_token_expiry) : null,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null
    };
  }
  
  // Password reset operations
  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      console.log("No user found with email:", email);
      return null;
    }

    // Generate a random token
    const token = require('crypto').randomBytes(32).toString('hex');
    // Set token expiry to 1 hour from now
    const tokenExpiry = new Date(Date.now() + 3600000);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          reset_token: token,
          reset_token_expiry: tokenExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error creating password reset token:", error);
        return null;
      }

      console.log(`Created reset token for user ${user.id}, expires:`, tokenExpiry);
      return token;
    } catch (error) {
      console.error("Exception creating password reset token:", error);
      return null;
    }
  }

  async getUserByResetToken(token: string): Promise<UserWithPassword | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (error || !data) {
      console.log("User not found by reset token");
      return undefined;
    }

    // Check if token is expired
    const tokenExpiry = data.reset_token_expiry ? new Date(data.reset_token_expiry) : null;
    if (!tokenExpiry || tokenExpiry < new Date()) {
      console.log("Reset token expired");
      return undefined;
    }

    return this.mapToUserWithPassword(data);
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user) {
      console.log("Invalid or expired reset token");
      return false;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          password: newPassword,
          reset_token: null,
          reset_token_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error resetting password:", error);
        return false;
      }

      console.log(`Password reset successful for user ${user.id}`);
      return true;
    } catch (error) {
      console.error("Exception resetting password:", error);
      return false;
    }
  }
}

// In-memory storage implementation as fallback
export class MemStorage implements IStorage {
  private users: UserWithPassword[] = [];
  private nextId = 1;

  async getUser(id: number): Promise<UserWithPassword | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<UserWithPassword | undefined> {
    return this.users.find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<UserWithPassword | undefined> {
    return this.users.find(user => user.email === email);
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      password: newPassword,
      updatedAt: new Date()
    };
    
    return true;
  }

  async createUser(userData: InsertUser): Promise<UserWithPassword> {
    const now = new Date();
    const user: UserWithPassword = {
      id: this.nextId++,
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.push(user);
    return user;
  }

  async upsertUser(userData: any): Promise<void> {
    console.log("Upserting user in memory storage:", userData);
    
    const userId = typeof userData.id === 'string' ? parseInt(userData.id, 10) || this.nextId++ : userData.id;
    
    const existingUserIndex = this.users.findIndex(u => 
      (typeof u.id === 'number' && u.id === userId) || 
      (u.email && userData.email && u.email === userData.email)
    );
    
    const now = new Date();
    
    if (existingUserIndex >= 0) {
      this.users[existingUserIndex] = {
        ...this.users[existingUserIndex],
        ...userData,
        id: userId,
        updatedAt: now
      };
    } else {
      const user: UserWithPassword = {
        id: userId,
        username: userData.username || `user${userId}`,
        password: userData.password || 'oauth-user',
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: now,
        updatedAt: now
      };
      
      this.users.push(user);
    }
  }
  
  // Password reset operations
  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      console.log("No user found with email:", email);
      return null;
    }

    // Generate a random token
    const token = require('crypto').randomBytes(32).toString('hex');
    // Set token expiry to 1 hour from now
    const tokenExpiry = new Date(Date.now() + 3600000);

    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      resetToken: token,
      resetTokenExpiry: tokenExpiry,
      updatedAt: new Date()
    };

    console.log(`Created reset token for user ${user.id}, expires:`, tokenExpiry);
    return token;
  }

  async getUserByResetToken(token: string): Promise<UserWithPassword | undefined> {
    const user = this.users.find(u => u.resetToken === token);
    if (!user) {
      console.log("User not found by reset token");
      return undefined;
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      console.log("Reset token expired");
      return undefined;
    }

    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user) {
      console.log("Invalid or expired reset token");
      return false;
    }

    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      return false;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date()
    };

    console.log(`Password reset successful for user ${user.id}`);
    return true;
  }
}

// Determine which storage implementation to use
let storageImpl: IStorage;

try {
  // Try to use Supabase storage first
  storageImpl = new SupabaseStorage();
  console.log("Using Supabase storage");
} catch (error) {
  // Fallback to memory storage if Supabase connection fails
  console.warn("Supabase initialization failed, falling back to in-memory storage:", error);
  storageImpl = new MemStorage();
  console.log("Using in-memory storage");
}

export const storage = storageImpl;