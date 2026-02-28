import { useEffect, useRef, useState } from "react";

const CornerWarning = () => {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    // Trigger only when mouse is very close to the top-right "window close" corner.
    const THRESHOLD_X = 28; // px from right edge
    const THRESHOLD_Y = 28; // px from top edge

    const onMove = (e: MouseEvent) => {
      // ignore if touch device
      if (typeof window === "undefined") return;
      const x = e.clientX;
      const y = e.clientY;
      const fromRight = window.innerWidth - x;
      // require mouse to be very close to top and very close to right
      const nearCorner = y <= THRESHOLD_Y && fromRight <= THRESHOLD_X;

      if (nearCorner) {
        if (hideTimer.current) {
          window.clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
        setVisible(true);
      } else {
        // schedule hide to avoid flicker when moving into overlay
        if (visible && !hideTimer.current) {
          hideTimer.current = window.setTimeout(() => {
            setVisible(false);
            hideTimer.current = null;
          }, 300);
        }
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [visible]);

  return (
    <div
      className={`corner-warning fixed inset-0 pointer-events-none z-50 ${
        visible ? "show" : ""
      }`}
      onMouseLeave={() => {
        // hide when mouse leaves the overlay area
        setVisible(false);
      }}
    >
      <div
        className="corner-warning-inner pointer-events-auto fixed top-0 right-0 w-full h-full flex items-center justify-center bg-foreground/95 text-center p-6"
        role="dialog"
        aria-hidden={!visible}
      >
        <div className="max-w-3xl text-2xl md:text-4xl font-bold text-primary-foreground bg-background/80 px-6 py-4 rounded">
          당.si누. ZㅣGol.d차.O을 닫,으re는 게2야????😡😡😡
        </div>
      </div>
    </div>
  );
};

export default CornerWarning;


