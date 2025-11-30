"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSIWE } from "./useSIWE";

export function useRequireAuth() {
  const router = useRouter();
  const { session } = useSIWE();

  useEffect(() => {
    if (!session.authenticated) {
      router.push("/?auth=required");
    }
  }, [session, router]);
}
