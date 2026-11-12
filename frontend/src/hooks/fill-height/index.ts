import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_HEIGHT = 240;

// Pixels between the element's top edge and the bottom of the window, so a list can scroll
// inside it without the page scrolling. Measured after every render, and again when the window
// or the container around the element changes size.
export const useFillHeight = (enabled: boolean, gap: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  const measure = (): void => {
    const node = ref.current;
    if (!enabled || !node) {
      setHeight(null);
      return;
    }
    const top = node.getBoundingClientRect().top + window.scrollY;
    setHeight(Math.max(Math.floor(window.innerHeight - top - gap), MIN_HEIGHT));
  };

  // Setting the same height again does not render, so this settles after one pass.
  useLayoutEffect(measure);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) {
      return;
    }
    // Deferred so resizing the card does not trigger a ResizeObserver loop warning.
    const observer = new ResizeObserver(() => requestAnimationFrame(measure));
    observer.observe(document.body);
    if (node.parentElement) observer.observe(node.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
    // `measure` is recreated every render and only reads `ref` and its arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, gap]);

  return { ref, height };
};
