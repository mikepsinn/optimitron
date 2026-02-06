/**
 * Popup entry point — initializes all tabs and handles navigation.
 */

import { renderTreatments } from "./treatments.js";
import { renderSymptoms } from "./symptoms.js";
import { renderFood, setupFoodInput } from "./food.js";

type TabName = "treatments" | "symptoms" | "food";

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
  setupNavigation();
  setupFoodInput();

  // Render all tabs
  await Promise.all([renderTreatments(), renderSymptoms(), renderFood()]);
}

void init();
