import React, { useMemo } from 'react';
import { useNotificationSocket } from '../realtime/useNotificationSocket';

/** Keeps the assignment alarm socket subscribed on every authenticated screen. */
export const JobAssignmentAlertListener: React.FC = () => {
  useNotificationSocket(useMemo(() => ({}), []));
  return null;
};
