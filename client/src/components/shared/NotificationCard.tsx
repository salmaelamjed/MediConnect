import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Bell, Calendar } from "lucide-react";
import type { Notification } from "@/types/notification";

interface NotificationCardProps {
  notification: Notification;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onMarkAsRead?: (id: number) => void;
}


export const NotificationCard = ({
  notification,
  onAccept,
  onDecline,
  onMarkAsRead,
}: NotificationCardProps) => {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

   const role=localStorage.getItem('role');
  const getTypeIcon = (type: string) => {
    if (type.includes("appointment")) return Calendar;
    return Bell;
  };

  const TypeIcon = getTypeIcon(notification.type);

  return (
    <div
      className={`relative px-6 py-3 border-b transition-colors cursor-pointer ${
        !notification.is_read 
          ? "bg-[hsl(var(--notification-selected))] hover:shadow-sm" 
          : "bg-card hover:bg-[hsl(var(--notification-card-hover))]"
      }`}
      onClick={() => !notification.is_read && onMarkAsRead?.(notification.id)}
    >
      <div className="flex items-start gap-4">
        {/* Icon/Avatar */}
        <div className="mt-1 shrink-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            !notification.is_read ? "bg-primary/15" : "bg-muted"
          }`}>
            <TypeIcon className={`h-5 w-5 ${
              !notification.is_read ? "text-primary" : "text-muted-foreground"
            }`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-1">
            <h4 className={`text-sm ${
              !notification.is_read ? "font-semibold text-foreground" : "font-normal text-foreground"
            }`}>
              {notification.title}
            </h4>
            {notification.priority === "high" && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded">
                Important
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(notification.sent_at)}
            </span>
          </div>

          <p className="mb-1 text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>

          {notification.type === "appointment_confirmation" &&
            !notification.is_read && role==='doctor' && (
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline?.(notification.id);
                  }}
                  className="h-8"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.(notification.id);
                  }}
                  className="h-8"
                >
                  Accept
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
