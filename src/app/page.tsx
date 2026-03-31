"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="h-screen w-full relative flex items-center bg-cover bg-[75%_20%] overflow-hidden"
      style={{ backgroundImage: 'url("/login_bg.png")' }}
    >
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-12">

        {/* Hero Text Section */}
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            AIIMS Bathinda<br />
            <span className="text-white">health camp platform</span>
          </h1>

          <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-2xl leading-relaxed font-light">
            By providing on-site health camps — AIIMS Bathinda brings healthcare to every school.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-12 items-start sm:items-center">
            <Link href="/request-camp" className="w-full sm:w-auto">
              <Button size="lg" className="h-16 px-10 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all shadow-xl font-bold border-0 w-full">
                Request a Health Camp
              </Button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg bg-transparent hover:bg-white/10 text-white rounded-full transition-all border-2 border-white/50 hover:border-white font-semibold flex items-center gap-2 group w-full">
                Portal Login <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>


        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="absolute bottom-8 right-8 z-10 hidden lg:block">
        <p className="text-white/30 text-xs font-medium tracking-widest uppercase">
          HealthCampPro &copy; 2026
        </p>
      </div>
    </div>
  );
}