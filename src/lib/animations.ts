/**
 * Utility animations helper for Mehta Dairy Sweet Mart
 */

/**
 * Perform a hardware-accelerated "Fly to Cart" visual transition.
 * Clones the source element, matches its initial bounding box, translates it to the target
 * element coordinates using a high-end bezier easing curve, and clean-up once complete.
 * 
 * @param sourceEl The element representing the item being added (e.g., product card image)
 * @param targetId The element ID of the destination (e.g., "header-cart-icon")
 */
export function animateFlyToCart(sourceEl: HTMLElement, targetId: string) {
  if (typeof window === "undefined" || !sourceEl) return;

  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  // Get current bounding rectangles
  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  // Create a clone element representing the flying product image
  const flyer = document.createElement("div");
  flyer.className = "fly-to-cart-particle";
  
  // Style the flying element
  // If the source element is an IMG, use its src. Otherwise, default style.
  let imgSrc = "";
  if (sourceEl instanceof HTMLImageElement) {
    imgSrc = sourceEl.src;
  } else {
    const imgInside = sourceEl.querySelector("img");
    if (imgInside) imgSrc = imgInside.src;
  }

  if (imgSrc) {
    flyer.style.backgroundImage = `url('${imgSrc}')`;
    flyer.style.backgroundSize = "contain";
    flyer.style.backgroundPosition = "center";
    flyer.style.backgroundRepeat = "no-repeat";
  } else {
    flyer.style.backgroundColor = "var(--brand-orange, #D46D2D)";
  }

  flyer.style.position = "fixed";
  flyer.style.left = `${sourceRect.left}px`;
  flyer.style.top = `${sourceRect.top}px`;
  flyer.style.width = `${sourceRect.width}px`;
  flyer.style.height = `${sourceRect.height}px`;
  flyer.style.borderRadius = "50%";
  flyer.style.boxShadow = "0 10px 25px rgba(212, 109, 45, 0.3)";
  flyer.style.zIndex = "9999";
  flyer.style.pointerEvents = "none";
  flyer.style.transformOrigin = "center";
  
  // High performance CSS transitions
  flyer.style.transition = "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)";
  
  document.body.appendChild(flyer);

  // Force reflow/repaint
  flyer.getBoundingClientRect();

  // Animate to target
  flyer.style.left = `${targetRect.left + targetRect.width / 2 - 20}px`;
  flyer.style.top = `${targetRect.top + targetRect.height / 2 - 20}px`;
  flyer.style.width = "24px";
  flyer.style.height = "24px";
  flyer.style.opacity = "0.2";
  flyer.style.transform = "scale(0.3) rotate(360deg)";

  // Cleanup
  setTimeout(() => {
    flyer.remove();
    // Dispatch arrival event for cart badge bounce
    window.dispatchEvent(new CustomEvent("cartBadgeAnimate"));
  }, 900);
}
