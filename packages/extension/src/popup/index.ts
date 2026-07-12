/**
 * Popup entry point — two top-level views:
 *   Today  — daily schedule from optimitron.com (agenda)
 *   Health — the original Digital Twin Safe logging tabs
 */

import { renderTreatments } from "./treatments.js";
import { renderSymptoms } from "./symptoms.js";
import { renderFood, setupFoodInput } from "./food.js";
import { renderAgenda } from "./agenda.js";

type TabName = "treatments" | "symptoms" | "food";
type ViewName = "today" | "health";

function setupViewSwitcher(): void {
  const viewButtons = document.querySelectorAll<HTMLButtonElement>(".view-btn");
  const views = document.querySelectorAll<HTMLElement>(".view");

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewName = btn.dataset["view"] as ViewName;

      viewButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach((v) => {
        v.classList.toggle("active", v.id === `view-${viewName}`);
      });
    });
  });
}

function setupNavigation(): void {
  const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-btn");
  const tabs = document.querySelectorAll<HTMLElement>(".tab-content");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset["tab"] as TabName;

      // Update active nav button
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show matching tab
      tabs.forEach((t) => {
        t.classList.toggle("active", t.id === `tab-${tabName}`);
      });
    });
  });
}

async function init(): Promise<void> {
  setupViewSwitcher();
  setupNavigation();
  setupFoodInput();

  // Render all views
  await Promise.all([
    renderAgenda(),
    renderTreatments(),
    renderSymptoms(),
    renderFood(),
  ]);
}

void init();
