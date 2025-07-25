// src/components/landing/SmoothScroll.tsx
// -- NEW COMPONENT TO MANAGE LENIS SMOOTH SCROLLING --

"use client";

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode } from 'react';

// هذا المكون يقوم بتهيئة Lenis وتطبيقه على children
function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis options={{ lerp: 0.1, duration: 1.5 }}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;