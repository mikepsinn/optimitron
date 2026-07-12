/**
 * Authenticated REST client for optimitron.com.
 *
 * Endpoints:
 *   GET    /api/extension/agenda            — the user's day
 *   PATCH  /api/tasks/{id}                  — snooze (dueAt)
 *   POST   /api/extension/tasks/{id}/done   — mark VERIFIED with evidence
 *   POST   /api/extension/tasks/{id}/skip   — record a skip (optional reason)
 *   DELETE /api/tasks/{id}                  — soft-delete
 */

import type { AgendaTask } from "./agenda-logic.js";
import { forceRefreshAccessToken, getValidAccessToken } from "./auth.js";
import { getApiBase } from "./config.js";

export interface AgendaResponse {
  generatedAt: string;
  nextAction: AgendaTask | null;
  reminders: AgendaTask[];
  tasks: AgendaTask[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = await getApiBase();
  let token = await getValidAccessToken();
  if (!token) throw new NotSignedInError();

  const request = (bearer: string) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
        Authorization: `Bearer ${bearer}`,
      },
    });

  let response = await request(token);
  if (response.status === 401) {
    token = await forceRefreshAccessToken();
    if (!token) throw new NotSignedInError();
    response = await request(token);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new ApiError(
      body?.error ?? `Request failed (${response.status})`,
      response.status,
    );
  }
  return response;
}

export async function getAgenda(): Promise<AgendaResponse> {
  const response = await apiFetch("/api/extension/agenda");
  return (await response.json()) as AgendaResponse;
}

export async function snoozeTask(taskId: string, dueAtIso: string): Promise<void> {
  await apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    body: JSON.stringify({ dueAt: dueAtIso }),
    method: "PATCH",
  });
}

export async function completeTask(taskId: string): Promise<void> {
  await apiFetch(`/api/extension/tasks/${encodeURIComponent(taskId)}/done`, {
    body: JSON.stringify({ completionEvidence: "completed via extension" }),
    method: "POST",
  });
}

export async function skipTask(taskId: string, reason?: string): Promise<void> {
  await apiFetch(`/api/extension/tasks/${encodeURIComponent(taskId)}/skip`, {
    body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
    method: "POST",
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
}
