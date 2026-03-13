interface SwipeableOptions {
  threshold?: number;
  maxSwipe?: number;
  onreveal?: () => void;
  onhide?: () => void;
}

export function swipeable(node: HTMLElement, options: SwipeableOptions = {}) {
  const threshold = options.threshold ?? 80;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
  let isRevealed = false;
  let directionLocked = false;
  let isHorizontal = false;

  function rubberBand(x: number): number {
    if (x <= threshold) return x;
    const overshoot = x - threshold;
    return threshold + overshoot * 0.3;
  }

  function setTransform(x: number) {
    const content = node.querySelector("[data-swipe-content]") as HTMLElement | null;
    if (content) {
      content.style.transform = `translateX(${-x}px)`;
      content.style.transition = isSwiping ? "none" : `transform 300ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1))`;
    }
  }

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
    directionLocked = false;
    isHorizontal = false;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const diffX = startX - touch.clientX;
    const diffY = touch.clientY - startY;

    if (!directionLocked && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      directionLocked = true;
      isHorizontal = Math.abs(diffX) > Math.abs(diffY);
    }

    if (!isHorizontal) return;

    e.preventDefault();

    if (isRevealed) {
      currentX = Math.max(0, threshold + diffX);
    } else {
      currentX = Math.max(0, diffX);
    }

    setTransform(rubberBand(currentX));
  }

  function handleTouchEnd() {
    isSwiping = false;
    if (!isHorizontal) return;

    if (currentX >= threshold && !isRevealed) {
      isRevealed = true;
      setTransform(threshold);
      options.onreveal?.();
    } else if (currentX < threshold / 2 && isRevealed) {
      isRevealed = false;
      setTransform(0);
      options.onhide?.();
    } else if (isRevealed) {
      setTransform(threshold);
    } else {
      setTransform(0);
    }
    currentX = 0;
  }

  function handleDocumentTouch(e: TouchEvent) {
    if (isRevealed && !node.contains(e.target as Node)) {
      isRevealed = false;
      setTransform(0);
      options.onhide?.();
    }
  }

  node.addEventListener("touchstart", handleTouchStart, { passive: true });
  node.addEventListener("touchmove", handleTouchMove, { passive: false });
  node.addEventListener("touchend", handleTouchEnd, { passive: true });
  document.addEventListener("touchstart", handleDocumentTouch, { passive: true });

  return {
    destroy() {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handleDocumentTouch);
    },
  };
}
