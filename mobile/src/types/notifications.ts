export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages?: number;
      totalPages?: number;
    };
  };
}

