import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  // Fallback initials if we have a name
  const getInitials = () => {
    if (!user) return "?";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    
    if (user.firstName) {
      return user.firstName.charAt(0);
    }
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return "?";
  };

  return (
    <Avatar className={className}>
      {user?.profileImageUrl ? (
        <AvatarImage
          src={user.profileImageUrl}
          alt={user.firstName || user.username || "User"}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  );
}
