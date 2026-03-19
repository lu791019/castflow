"use client";

import { Platform } from "@/lib/types";
import { PLATFORM_SPECS } from "@/lib/prompts/generate-content";
import { cn } from "@/lib/utils";

interface PlatformTabsProps {
  activePlatform: Platform;
  onSelect: (platform: Platform) => void;
  platforms: Platform[];
}

export function PlatformTabs({
  activePlatform,
  onSelect,
  platforms,
}: PlatformTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => onSelect(platform)}
          className={cn(
            "shrink-0 px-4 py-2 text-sm font-medium transition-colors",
            activePlatform === platform
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {PLATFORM_SPECS[platform].name}
        </button>
      ))}
    </div>
  );
}
