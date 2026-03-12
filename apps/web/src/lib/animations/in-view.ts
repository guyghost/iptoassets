export function inView(
  node: HTMLElement,
  options?: { class?: string; delay?: number; once?: boolean },
) {
  const className = options?.class ?? "animate-card-enter";
  const delay = options?.delay ?? 0;
  const once = options?.once ?? true;

  node.style.opacity = "0";

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setTimeout(() => {
            node.style.opacity = "";
            node.classList.add(className);
          }, delay);
          if (once) observer.unobserve(node);
        }
      }
    },
    { threshold: 0.1 },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
