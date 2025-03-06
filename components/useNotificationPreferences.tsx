"use client";

import { useEffect, useState } from "react";

export function useNotificationPreferences() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      setEnabled(true);
    }
  }, []);

  function toggleNotifications(checked: boolean) {
    if (!checked) {
      setEnabled(false);
      return;
    }

    if (typeof Notification === "undefined") {
      alert("This browser does not support system notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      setEnabled(true);
    } else if (Notification.permission === "denied") {
      alert("Notifications blocked in your browser settings.");
    } else {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          setEnabled(true);
        } else {
          setEnabled(false);
        }
      });
    }
  }

  return { notificationEnabled: enabled, toggleNotifications };
}
