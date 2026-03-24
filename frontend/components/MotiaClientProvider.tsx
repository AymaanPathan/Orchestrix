"use client";

import { MotiaStreamProvider } from "@motiadev/stream-client-react";
import { WS_BASE } from "../utils/api";

export function MotiaClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotiaStreamProvider address={WS_BASE}>{children}</MotiaStreamProvider>
  );
}
