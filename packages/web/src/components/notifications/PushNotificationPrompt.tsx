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
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">
        Daily Check-in Reminders
      </h3>
      <p className="text-xs text-slate-400 mb-3">
        Get gentle reminders to rate your health and happiness — even without the browser extension.
      </p>

      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}

      {subscribed ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400">Notifications enabled</span>
          <button
            onClick={() => void handleUnsubscribe()}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Disable
          </button>
        </div>
      ) : (
        <button
          onClick={() => void handleSubscribe()}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Enable Reminders
        </button>
      )}
    </div>
  );
}
