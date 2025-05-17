import { User } from "@shared/schema";

// Check if a user is authenticated
export function isUserAuthenticated(user: User | null | undefined): boolean {
  return !!user;
}

// Get user display name
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "Guest";
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return "User";
}

// Get user initials for avatars
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return "?";
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  }
  
  if (user.firstName) {
    return user.firstName.charAt(0);
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return "?";
}
