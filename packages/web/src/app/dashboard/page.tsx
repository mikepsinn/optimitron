"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to sign in to view your dashboard.
          </p>
          <Link
            href="/api/auth/signin"
            className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Sign in with GitHub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {session.user?.name}. Here&apos;s your governance overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Preferences Expressed", value: "—", icon: "🗳️" },
          { label: "Policies Analyzed", value: "—", icon: "📋" },
          { label: "Alignment Score", value: "—", icon: "📊" },
          { label: "Jurisdictions", value: "—", icon: "🌐" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Recent Comparisons</h2>
          <p className="text-gray-500 text-sm">
            No comparisons yet. Head to{" "}
            <Link href="/preferences" className="text-primary-500 hover:underline">
              Preferences
            </Link>{" "}
            to start expressing what matters to you.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Top Policy Recommendations</h2>
          <p className="text-gray-500 text-sm">
            Policy recommendations will appear here once enough preferences and
            outcome data are collected.
          </p>
        </div>
      </div>
    </div>
  );
}
