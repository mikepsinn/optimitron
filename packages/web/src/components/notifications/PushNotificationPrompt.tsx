"use client";

import { useEffect, useState } from "react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentPushSubscription,
} from "@/lib/push-notifications";

export function PushNotificationPrompt() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isPushSupported()) {
        setLoading(false);
        return;
      }
      setSupported(true);

      const existing = await getCurrentPushSubscription();
      setSubscribed(!!existing);
      setLoading(false);
    };

    void checkStatus();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError("Notification permission denied. Enable it in browser settings.");
      setLoading(false);
      return;
    }

    const subscription = await subscribeToPush();
    if (subscription) {
      setSubscribed(true);
    } else {
      setError("Failed to subscribe to push notifications.");
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);

    const success = await unsubscribeFromPush();
    if (success) {
      setSubscribed(false);
    } else {
      setError("Failed to unsubscribe.");
    }
    setLoading(false);
  };

  if (!supported || loading) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-1">
        Daily Check-in Reminders
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Get gentle reminders to rate your health and happiness — even without the browser extension.
      </p>

      {error && (
        <p className="text-xs text-brutal-red mb-2">{error}</p>
      )}

      {subscribed ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-brutal-cyan">Notifications enabled</span>
          <button
            onClick={() => void handleUnsubscribe()}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Disable
          </button>
        </div>
      ) : (
        <button
          onClick={() => void handleSubscribe()}
          disabled={loading}
          className="rounded-md bg-brutal-pink px-3 py-1.5 text-xs font-medium text-white hover:bg-brutal-pink/80 disabled:opacity-50"
        >
          Enable Reminders
        </button>
      )}
    </div>
  );
}
