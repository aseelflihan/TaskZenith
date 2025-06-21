// D:\applications\tasks\TaskZenith\src\components\auth\LoadingOverlay.tsx
// -- NEW COMPONENT --

"use client";

import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
// تأكد من أن المسار هنا يطابق اسم الملف الذي وضعته في مجلد public
import loadingAnimation from "../../../public/animations/Animation_loading.json";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export const LoadingOverlay = ({ 
  isLoading, 
  text = "Signing in, just a moment..." 
}: LoadingOverlayProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="text-center">
            <Lottie 
              animationData={loadingAnimation} 
              loop={true} 
              className="w-40 h-40 mx-auto" // يمكنك تعديل الحجم هنا
            />
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-4 text-lg font-semibold text-foreground"
            >
              {text}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              Securing your session...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};