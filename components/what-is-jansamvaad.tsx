"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface WhatIsJanSamvaadProps {
  className?: string;
}

export default function WhatIsJanSamvaad({ className }: WhatIsJanSamvaadProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`w-full max-w-5xl mx-auto p-5 ${className || ""}`}>
      <button
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors"
      >
        <span className="font-semibold">What is JanSamvaad?</span>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
          open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-4 text-sm text-muted-foreground space-y-3">
          <p>
            JanSamvaad is a crowdsourced civic issue reporting and resolution platform that helps citizens report local problems with location and photos and enables officials to track and resolve them transparently.
          </p>
          <p>
            Reports are geotagged, routed to the appropriate department, and visible on an interactive map. The community can upvote to prioritize, and reporters receive updates as statuses change.
          </p>
        </div>
      </div>
    </section>
  );
}


