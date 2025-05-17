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
  createUser(user: InsertUser): Promise<UserWithPassword>;
  upsertUser(user: any): Promise<void>; // For OpenID Connect
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
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null
    };
  }
}

// Fallback to memory storage if Supabase connection fails
export class MemStorage implements IStorage {
  private users: UserWithPassword[] = [];
  private nextId = 1;

  async getUser(id: number): Promise<UserWithPassword | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<UserWithPassword | undefined> {
    return this.users.find(user => user.username === username);
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
        createdAt: now,
        updatedAt: now
      };
      
      this.users.push(user);
    }
  }
}

// Determine which storage implementation to use
let storageImpl: IStorage;

try {
  // Try to use Supabase storage
  storageImpl = new SupabaseStorage();
  console.log("Using Supabase storage");
} catch (error) {
  // Fallback to memory storage
  console.warn("Supabase initialization failed, falling back to in-memory storage:", error);
  storageImpl = new MemStorage();
  console.log("Using in-memory storage");
}

export const storage = storageImpl;