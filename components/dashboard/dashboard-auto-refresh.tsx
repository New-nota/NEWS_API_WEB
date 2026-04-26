"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  hasActiveRequests: boolean;
};

export function DashboardAutoRefresh({ hasActiveRequests }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!hasActiveRequests) return;

    const intervalId = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [hasActiveRequests, router]);

  return null;
}