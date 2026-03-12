export function countUp(node: HTMLElement, target: number) {
  let animationId: number;

  function animate(newTarget: number) {
    cancelAnimationFrame(animationId);
    if (newTarget === 0 || isNaN(newTarget)) {
      node.textContent = String(newTarget || 0);
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const startValue = 0;

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(startValue + (newTarget - startValue) * eased));
      if (progress < 1) animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);
  }

  animate(target);

  return {
    update(newTarget: number) {
      animate(newTarget);
    },
    destroy() {
      cancelAnimationFrame(animationId);
    },
  };
}
