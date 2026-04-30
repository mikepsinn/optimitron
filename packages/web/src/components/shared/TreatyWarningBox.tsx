"use client"

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function TreatyWarningBox() {
  return (
    <div className="bg-brutal-yellow border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-12 h-12 text-brutal-pink" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-black uppercase mb-2">
            <span className="text-brutal-pink">WARNING:</span> LIMITED TRIALS AVAILABLE
          </h2>
          <p className="font-bold text-sm md:text-base leading-relaxed">
            You can search for trials, but you probably can't join any because the{" "}
            <span className="text-brutal-pink">1% Treaty hasn't passed yet</span>. Most trials are severely limited
            by lack of funding and bureaucratic barriers. Help change this!
          </p>
        </div>
        <div className="flex-shrink-0 w-full md:w-auto">
          <Link
            href={ROUTES.vote}
            className="inline-flex w-full items-center justify-center border-4 border-primary bg-brutal-pink px-6 py-3 text-lg font-black uppercase text-brutal-pink-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:w-auto"
          >
            FIX IT
          </Link>
        </div>
      </div>
    </div>
  );
}
