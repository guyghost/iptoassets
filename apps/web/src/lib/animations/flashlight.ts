export function flashlight(node: HTMLElement) {
  function handleMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--flash-x", `${e.clientX - rect.left}px`);
    node.style.setProperty("--flash-y", `${e.clientY - rect.top}px`);
  }

  node.classList.add("flashlight-card");
  node.addEventListener("mousemove", handleMove);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMove);
      node.classList.remove("flashlight-card");
    },
  };
}
