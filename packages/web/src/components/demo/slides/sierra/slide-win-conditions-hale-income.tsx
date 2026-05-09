"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_AVG_INCOME_2025,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const currentHALE = GLOBAL_HALE_CURRENT.value.toFixed(1);
const targetHALE = TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1);
const haleProgress = (GLOBAL_HALE_CURRENT.value / TREATY_PROJECTED_HALE_YEAR_15.value) * 100;
const currentIncome = formatCurrency(Math.round(GLOBAL_AVG_INCOME_2025.value));
const targetIncome = formatCurrency(Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value));
const incomeProgress = (GLOBAL_AVG_INCOME_2025.value / TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value) * 100;

export function SlideWinConditionsHaleIncome() {
  return (
    <SierraSlideWrapper act={2} className="text-background">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1200px] mx-auto w-full">
        <h1 className="font-pixel text-2xl md:text-4xl text-background text-center">
          HOW YOU WIN
        </h1>

        <div className="grid grid-cols-2 gap-8 w-full">
          {/* HALE */}
          <div className="bg-muted border-2 border-background rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">❤️</div>
            <div className="font-pixel text-xl md:text-2xl text-sierra-cyan mb-4">
              HEALTHY LIFE EXPECTANCY
            </div>
            <div className="w-full mb-4">
              <div className="h-4 bg-zinc-800 border-2 border-background/50 rounded-sm overflow-hidden">
                <div className="h-full bg-background" style={{ width: `${haleProgress}%` }} />
              </div>
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-muted-foreground">
              {currentHALE}
            </div>
            <div className="font-pixel text-2xl text-muted-foreground my-2">→</div>
            <div className="font-pixel text-4xl md:text-6xl text-sierra-cyan">
              {targetHALE} yrs
            </div>
          </div>

          {/* Income */}
          <div className="bg-muted border-2 border-background rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">💰</div>
            <div className="font-pixel text-xl md:text-2xl text-background mb-4">
              MEDIAN INCOME
            </div>
            <div className="w-full mb-4">
              <div className="h-4 bg-zinc-800 border-2 border-background/50 rounded-sm overflow-hidden">
                <div className="h-full bg-background" style={{ width: `${incomeProgress}%` }} />
              </div>
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-muted-foreground">
              {currentIncome}
            </div>
            <div className="font-pixel text-2xl text-muted-foreground my-2">→</div>
            <div className="font-pixel text-4xl md:text-6xl text-background">
              {targetIncome}
            </div>
          </div>
        </div>

        <div className="font-pixel text-3xl md:text-5xl text-brutal-red text-center">
          BY 2040
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideWinConditionsHaleIncome;
