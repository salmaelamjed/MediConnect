"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NotificationTabs } from "@/components/shared/NotificationTabs";
import { NotificationCard } from "@/components/shared/NotificationCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications";
import { clearMessages } from "@/store/notifications/notificationsSlice";
import { actMarkNotificationAsRead } from "@/store/notifications/act/actMarkNotificationAsRead";
import { actMarkAllNotificationsAsRead } from "@/store/notifications/act/actMarkAllNotificationsAsRead";
import { actConfirmReservation } from "@/store/reservations/act/actConfirmReservation";
import { actDeleteReservation } from "@/store/reservations/reservationsSlice";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { notifications, loading, error, successMessage } = useAppSelector((state) => state.notifications);
  const dispatch = useAppDispatch();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const appointmentCount = notifications.filter(
    (n) => n.type === "appointment_confirmation" && !n.is_read
  ).length;
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    return notification.type === activeTab;
  });

  useEffect(() => {
    if (loading === "idle") {
      dispatch(actGetNotifications());
    }
  }, [dispatch, loading]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearMessages());
    }
    if (error) {
      toast.error(error);
      dispatch(clearMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleMarkAsRead = async (id: number) => {
    await dispatch(actMarkNotificationAsRead(id));
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(actMarkAllNotificationsAsRead());
  };

  const handleAccept = async (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification?.reservation_id) {
      await dispatch(actConfirmReservation(notification.reservation_id));
    } else {
      toast.error("No reservation associated with this notification");
    }
  };

  const handleDecline = async (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification?.reservation_id) {
      await dispatch(actDeleteReservation(notification.reservation_id));
    } else {
      toast.error("No reservation associated with this notification");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-normal text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2 text-muted-foreground hover:text-foreground"
                disabled={loading === "pending"}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all as read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b bg-card">
          <NotificationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              all: unreadCount,
              appointment_confirmation: appointmentCount,
            }}
          />
        </div>

        {/* Notifications List */}
        <div className="bg-card">
          {loading === "pending" ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-muted">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-base font-medium">Loading...</h3>
              <p className="text-sm text-muted-foreground">
                Fetching your notifications...
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-muted">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-base font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;