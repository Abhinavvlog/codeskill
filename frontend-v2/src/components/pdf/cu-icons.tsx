import React from "react";
import { Svg, Path, Circle, Rect, G, Line } from "@react-pdf/renderer";
import { BRAND_COLORS } from "./cu-assets";

// 1. Shield Check Icon (Proctored Security)
export const ShieldCheckIcon = ({ size = 12, color = BRAND_COLORS.cuRed }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Svg>
);

// 2. Trophy Icon (Score & Achievement)
export const TrophyIcon = ({ size = 14, color = BRAND_COLORS.warningAmber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 4h16v6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V4z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 16v4M8 20h8"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// 3. Target Icon (Problems & Focus)
export const TargetIcon = ({ size = 14, color = BRAND_COLORS.blueAccent }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={1.5} fill="none" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// 4. Check Circle Icon (Accuracy & Passed)
export const CheckCircleIcon = ({ size = 14, color = BRAND_COLORS.successGreen }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
    <Path
      d="M9 12l2 2 4-4"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Svg>
);

// 5. Award / Percentile Icon
export const AwardIcon = ({ size = 14, color = BRAND_COLORS.navyDark }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="8" r="6" stroke={color} strokeWidth={2} fill="none" />
    <Path
      d="M15.4 12.8L17 22l-5-3-5 3 1.6-9.2"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Svg>
);

// 6. Clock Icon (Duration & Time)
export const ClockIcon = ({ size = 10, color = BRAND_COLORS.slateMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
  </Svg>
);

// 7. Calendar Icon (Date)
export const CalendarIcon = ({ size = 10, color = BRAND_COLORS.slateMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={2} fill="none" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.5} />
  </Svg>
);

// 8. Department Seal & Lab Emblem (Top-Right Academic Seal)
export const DepartmentSeal = ({ size = 42 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    {/* Outer Academic Gear/Seal ring */}
    <Circle cx="30" cy="30" r="28" stroke={BRAND_COLORS.cuRed} strokeWidth={1.5} fill={BRAND_COLORS.bgSubtle} />
    <Circle cx="30" cy="30" r="24.5" stroke={BRAND_COLORS.borderDark} strokeWidth={0.75} fill="none" strokeDasharray="2 1.5" />
    <Circle cx="30" cy="30" r="21" stroke={BRAND_COLORS.navyDark} strokeWidth={1} fill="#FFFFFF" />
    
    {/* Center Skill & Lab Insignia (Shield + Code glyph) */}
    <Path
      d="M30 16 L38 20 V29 C38 34 30 38 30 38 C30 38 22 34 22 29 V20 Z"
      fill={BRAND_COLORS.cuRedBg}
      stroke={BRAND_COLORS.cuRed}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
    {/* Code bracket inside shield */}
    <Path
      d="M26 26 L24 28 L26 30 M34 26 L36 28 L34 30 M31 24 L29 32"
      stroke={BRAND_COLORS.cuRed}
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* Stars */}
    <Circle cx="13" cy="30" r="1.2" fill={BRAND_COLORS.cuRed} />
    <Circle cx="47" cy="30" r="1.2" fill={BRAND_COLORS.cuRed} />
  </Svg>
);
