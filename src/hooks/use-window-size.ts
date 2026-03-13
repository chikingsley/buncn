import { useEffect, useState } from "react";

interface WindowSize {
  height: number;
  width: number;
}

interface UseWindowSizeProps {
  defaultHeight?: number;
  defaultWidth?: number;
}

export function useWindowSize(props: UseWindowSizeProps = {}): WindowSize {
  const { defaultWidth = 0, defaultHeight = 0 } = props;

  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: defaultWidth,
    height: defaultHeight,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Set initial size after mount to avoid hydration mismatch
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    let timeoutId: NodeJS.Timeout | null = null;

    function onResize() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150);
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return windowSize;
}
