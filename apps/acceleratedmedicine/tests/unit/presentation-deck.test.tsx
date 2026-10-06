import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Deck } from "../../components/present/deck";
import { alzheimers } from "../../components/present/patient-journey/alzheimers";
import { patientJourneySlides } from "../../components/present/patient-journey/slides";
import { loadScript, onScreenOnly } from "../../lib/present-script";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
afterAll(() => vi.unstubAllGlobals());

const slides = ["1", "2", "B1"].map(key => ({
  key, label: `Slide ${key}`, notes: `Notes for ${key}`, content: <p>Content {key}</p>,
}));
const visible = () => screen.getAllByRole("region", { hidden: true }).filter(el => !el.hidden).map(el => el.textContent);

describe("presentation deck", () => {
  it("moves between slides with the keyboard and keeps the slide in the address", () => {
    render(<Deck title="Test deck" slides={slides} />);
    expect(visible()).toEqual(["Content 1"]);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(visible()).toEqual(["Content 2"]);
    expect(window.location.hash).toBe("#2");
    fireEvent.keyDown(window, { key: "End" });
    expect(visible()).toEqual(["Content B1"]);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(visible()).toEqual(["Content B1"]);
    fireEvent.keyDown(window, { key: "Home" });
    expect(visible()).toEqual(["Content 1"]);
    expect(screen.getByText("Slide 1 of 3: Slide 1")).toBeInTheDocument();
  });

  it("opens the slide named in the address and shows speaker notes on request", () => {
    window.history.replaceState(null, "", "/#B1");
    render(<Deck title="Test deck" slides={slides} />);
    expect(visible()).toEqual(["Content B1"]);
    act(() => {
      window.history.replaceState(null, "", "/#2");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(visible()).toEqual(["Content 2"]);
    expect(screen.queryByText("Notes for 2")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByText("Notes for 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("Notes for 1")).toBeInTheDocument();
  });

  it("offers no speaker notes when the slides carry none", () => {
    render(<Deck title="Test deck" slides={slides.map(({ notes: _notes, ...slide }) => slide)} />);
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.queryByRole("complementary", { name: "Speaker notes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show speaker notes" })).not.toBeInTheDocument();
  });

  it("builds one slide per script slide, with notes only for a presenter", () => {
    const script = loadScript("patient-journey");
    const presenterSlides = patientJourneySlides(script, alzheimers);
    expect(presenterSlides.map(slide => slide.key)).toEqual(script.map(slide => slide.key));
    expect(presenterSlides.every(slide => slide.label && slide.notes)).toBe(true);

    const publicSlides = patientJourneySlides(script.map(onScreenOnly), alzheimers);
    expect(publicSlides.map(slide => slide.label)).toEqual(presenterSlides.map(slide => slide.label));
    expect(publicSlides.some(slide => slide.notes || slide.purpose)).toBe(false);

    expect(() => patientJourneySlides([...script, { ...script[0], key: "21" }], alzheimers))
      .toThrow("slide 21 has no component");
  });
});
