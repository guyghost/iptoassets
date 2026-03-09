// NOTE: These tests use Svelte 5's createRawSnippet to pass children as snippets.
// If @testing-library/svelte has compatibility issues with Svelte 5, these tests
// may need adjustments as the ecosystem matures.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Card from "./Card.svelte";

function textSnippet(text: string) {
  return createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));
}

describe("Card", () => {
  it("renders with children content", () => {
    const { container } = render(Card, {
      props: { children: textSnippet("Card content") },
    });
    expect(container.textContent).toContain("Card content");
  });

  it("renders as a div element", () => {
    const { container } = render(Card, {
      props: { children: textSnippet("Content") },
    });
    const card = container.querySelector("div");
    expect(card).toBeTruthy();
  });

  it("has border and shadow styling", () => {
    const { container } = render(Card, {
      props: { children: textSnippet("Styled card") },
    });
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border");
    expect(card.className).toContain("shadow");
  });

  it("has rounded corners", () => {
    const { container } = render(Card, {
      props: { children: textSnippet("Rounded card") },
    });
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded");
  });
});
