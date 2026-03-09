// NOTE: These tests use Svelte 5's createRawSnippet to pass children as snippets.
// If @testing-library/svelte has compatibility issues with Svelte 5, these tests
// may need adjustments as the ecosystem matures.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Badge from "./Badge.svelte";

function textSnippet(text: string) {
  return createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));
}

describe("Badge", () => {
  it("renders with default variant", () => {
    render(Badge, { props: { children: textSnippet("Status") } });
    const badge = screen.getByText("Status");
    expect(badge).toBeTruthy();
  });

  it("applies default variant classes", () => {
    render(Badge, { props: { children: textSnippet("Default") } });
    const badge = screen.getByText("Default").closest("span.inline-flex");
    expect(badge).toBeTruthy();
    expect(badge!.className).toContain("bg-[var(--color-neutral-100)]");
  });

  it("applies success variant classes", () => {
    render(Badge, {
      props: { children: textSnippet("Active"), variant: "success" },
    });
    const badge = screen.getByText("Active").closest("span.inline-flex");
    expect(badge!.className).toContain("bg-green-100");
  });

  it("applies warning variant classes", () => {
    render(Badge, {
      props: { children: textSnippet("Pending"), variant: "warning" },
    });
    const badge = screen.getByText("Pending").closest("span.inline-flex");
    expect(badge!.className).toContain("bg-amber-100");
  });

  it("applies danger variant classes", () => {
    render(Badge, {
      props: { children: textSnippet("Expired"), variant: "danger" },
    });
    const badge = screen.getByText("Expired").closest("span.inline-flex");
    expect(badge!.className).toContain("bg-red-100");
  });

  it("applies info variant classes", () => {
    render(Badge, {
      props: { children: textSnippet("Info"), variant: "info" },
    });
    const badge = screen.getByText("Info").closest("span.inline-flex");
    expect(badge!.className).toContain("bg-blue-100");
  });

  it("renders as a span element", () => {
    render(Badge, { props: { children: textSnippet("Tag") } });
    const badge = screen.getByText("Tag").closest("span.inline-flex");
    expect(badge).toBeTruthy();
    expect(badge!.tagName).toBe("SPAN");
  });
});
