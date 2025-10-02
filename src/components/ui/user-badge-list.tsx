import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface UserBadgeListProps {
  users: Array<{ id: string; display_name: string }>;
  label?: string;
  maxDisplay?: number;
}

export const UserBadgeList = ({ users, label = "Iscritti:", maxDisplay }: UserBadgeListProps) => {
  if (!users || users.length === 0) return null;

  const displayUsers = maxDisplay ? users.slice(0, maxDisplay) : users;
  const remainingCount = maxDisplay && users.length > maxDisplay ? users.length - maxDisplay : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Users className="h-3 w-3" />
        {label}
      </span>
      {displayUsers.map((user) => (
        <Badge key={user.id} variant="secondary" className="text-xs">
          {user.display_name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} altri
        </Badge>
      )}
    </div>
  );
};