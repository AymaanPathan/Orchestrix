"use client";

interface StepBadgeProps {
  step: number | string;
}

export default function StepBadge({ step }: StepBadgeProps) {
  const isStart = step === "START";

  return (
    <div
      className="
        absolute
        -top-3
        left-3
        z-20
        px-2.5
        h-6
        flex
        items-center
        justify-center
        rounded-full
        text-[11px]
        font-semibold
        tracking-tight
        backdrop-blur-xl
        border
        shadow-sm
        select-none

        bg-white/[0.08]
        text-white
        border-white/[0.18]
      "
    >
      {isStart ? "START" : step}
    </div>
  );
}
