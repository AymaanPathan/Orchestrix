"use client";

import { useEffect, useState } from "react";
import EtheralShadow from "@/components/Ui/etheral-shadow";

const steps = [
  "Analyzing your requirements",
  "Understanding workflow logic",
  "Generating node structure",
  "Creating connections",
  "Optimizing workflow",
  "Finalizing API design",
];

export function AIGenerationScreen({
  done,
  onComplete,
}: {
  done: boolean;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // Step progression
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Completion
  useEffect(() => {
    if (!done) return;
    const timeout = setTimeout(onComplete, 900);
    return () => clearTimeout(timeout);
  }, [done, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* Animated black background */}
      <EtheralShadow intensity={1.2} speed={0.8} />
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h1
          key={currentStep}
          className="
            text-center
            text-white/80
            font-semibold
            tracking-tight
            leading-[1.1]
            text-[clamp(2.5rem,6vw,5rem)]
            transition-opacity
            duration-500
          "
        >
          {steps[currentStep]}
        </h1>
      </div>
    </div>
  );
}
