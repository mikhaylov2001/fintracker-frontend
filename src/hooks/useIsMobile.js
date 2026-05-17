import { useEffect, useState } from "react";

/** true при ширине viewport < breakpoint (по умолчанию 640px). */
export function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return mobile;
}
