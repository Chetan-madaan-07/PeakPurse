"use client";

import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconMessageChatbot,
  IconChartPie,
  IconReceiptTax,
  IconHistory,
  IconSmartHome,
  IconUsers,
  IconRefresh,
  IconChartBar
} from "@tabler/icons-react";

export function AppDock() {
  const links = [
    {
      title: "Dashboard",
      icon: (
        <IconSmartHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "PeakBot AI",
      icon: (
        <IconMessageChatbot className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/chat",
    },
    {
      title: "Investments",
      icon: (
        <IconChartPie className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/investment",
    },
    {
      title: "Tax Engine",
      icon: (
        <IconReceiptTax className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/tax",
    },
    {
      title: "CA Finder",
      icon: (
        <IconUsers className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/ca-directory",
    },
    {
      title: "Benchmarking",
      icon: (
        <IconChartBar className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/benchmarking",
    },
    {
      title: "Subscriptions",
      icon: (
        <IconRefresh className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/subscriptions",
    },
  ];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
      <FloatingDock
        mobileClassName="translate-y-20"
        items={links}
      />
    </div>
  );
}
