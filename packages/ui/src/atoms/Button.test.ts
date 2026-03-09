// NOTE: These tests use Svelte 5's createRawSnippet to pass children as snippets.
// If @testing-library/svelte has compatibility issues with Svelte 5, these tests
// may need adjustments as the ecosystem matures.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Button from "./Button.svelte";

function textSnippet(text: string) {
  return createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));
}

describe("Button", () => {
  it("renders with default props", () => {
    render(Button, { props: { children: textSnippet("Click me") } });
    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
    expect(button.textContent).toContain("Click me");
  });

  it("applies primary variant classes by default", () => {
    render(Button, { props: { children: textSnippet("Primary") } });
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-[var(--color-primary-600)]");
  });

  it("applies secondary variant classes", () => {
    render(Button, {
      props: { children: textSnippet("Secondary"), variant: "secondary" },
    });
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-white");
  });

  it("applies danger variant classes", () => {
    render(Button, {
      props: { children: textSnippet("Danger"), variant: "danger" },
    });
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-[var(--color-danger-600)]");
  });

  it("applies ghost variant classes", () => {
    render(Button, {
      props: { children: textSnippet("Ghost"), variant: "ghost" },
    });
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
  });

  it("applies sm size classes", () => {
    render(Button, {
      props: { children: textSnippet("Small"), size: "sm" },
    });
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-[var(--space-3)]");
  });

  it("applies md size classes by default", () => {
    render(Button, { props: { children: textSnippet("Medium") } });
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-[var(--space-4)]");
  });

  it("applies lg size classes", () => {
    render(Button, {
      props: { children: textSnippet("Large"), size: "lg" },
    });
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-[var(--space-6)]");
  });

  it("renders as disabled when disabled prop is set", () => {
    render(Button, {
      props: { children: textSnippet("Disabled"), disabled: true },
    });
    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(Button, {
      props: { children: textSnippet("Clickable"), onclick: handleClick },
    });
    const button = screen.getByRole("button");
    await fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
