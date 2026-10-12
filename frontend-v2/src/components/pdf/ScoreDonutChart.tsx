import React from "react";
import { View, Text, Svg, Circle, G, StyleSheet } from "@react-pdf/renderer";
import { BRAND_COLORS } from "./cu-assets";

interface ScoreDonutChartProps {
  score: number;
  maxScore: number;
  easyScore: number;
  easyMax: number;
  medScore: number;
  medMax: number;
  hardScore: number;
  hardMax: number;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND_COLORS.bgCard,
    borderWidth: 1,
    borderColor: BRAND_COLORS.borderLight,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 9,
  },
  chartWrapper: {
    width: 88,
    height: 88,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerTextBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 58,
  },
  centerPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
    textAlign: "center",
  },
  centerLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: BRAND_COLORS.slateMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 0.5,
  },
  centerSub: {
    fontSize: 6,
    color: BRAND_COLORS.slateLight,
    marginTop: 0.5,
  },
  barsContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    justifyContent: "center",
  },
  barRow: {
    marginBottom: 4.5,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  barLabelWrap: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  barLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: BRAND_COLORS.slateText,
  },
  barScore: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    lineHeight: 1.3,
    fontSize: 7,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
  },
  barTrack: {
    width: "100%",
    height: 4.5,
    backgroundColor: BRAND_COLORS.borderLight,
    borderRadius: 2.25,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2.25,
  },
  // Dedicated Total Evaluation summary box with clear, non-overlapping stacked hierarchy
  totalSummaryCard: {
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.borderLight,
    paddingTop: 4,
    marginTop: 3,
    backgroundColor: BRAND_COLORS.bgSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3.5,
  },
  totalLabel: {
    fontSize: 7.2,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: BRAND_COLORS.cuRed,
    letterSpacing: 0.1,
  },
});

export const ScoreDonutChart = ({
  score,
  maxScore,
  easyScore,
  easyMax,
  medScore,
  medMax,
  hardScore,
  hardMax,
}: ScoreDonutChartProps) => {
  const safeMax = Math.max(1, maxScore || 0);
  const safeScore = score || 0;
  const percentage = Math.round((safeScore / safeMax) * 100);

  // Circle geometry for Donut
  const radius = 33;
  const strokeWidth = 9.5;
  const circumference = 2 * Math.PI * radius; // ~207.35

  // Calculate arc slices proportionally based on max marks weight
  const safeEasyMax = Math.max(0, easyMax || 0);
  const safeMedMax = Math.max(0, medMax || 0);
  const safeHardMax = Math.max(0, hardMax || 0);
  const sumMax = Math.max(1, safeEasyMax + safeMedMax + safeHardMax);

  // Normalized fractions for each category ring
  const easyFrac = (safeEasyMax / sumMax) * Math.min(1, Math.max(0, (easyScore || 0) / Math.max(1, safeEasyMax)));
  const medFrac = (safeMedMax / sumMax) * Math.min(1, Math.max(0, (medScore || 0) / Math.max(1, safeMedMax)));
  const hardFrac = (safeHardMax / sumMax) * Math.min(1, Math.max(0, (hardScore || 0) / Math.max(1, safeHardMax)));

  const easyLen = easyFrac * circumference;
  const medLen = medFrac * circumference;
  const hardLen = hardFrac * circumference;

  const easyPct = safeEasyMax > 0 ? Math.round(((easyScore || 0) / safeEasyMax) * 100) : 0;
  const medPct = safeMedMax > 0 ? Math.round(((medScore || 0) / safeMedMax) * 100) : 0;
  const hardPct = safeHardMax > 0 ? Math.round(((hardScore || 0) / safeHardMax) * 100) : 0;

  return (
    <View style={styles.container} wrap={false}>
      {/* Donut Chart Visual */}
      <View style={styles.chartWrapper}>
        <Svg width={88} height={88} viewBox="0 0 88 88">
          {/* Background Track Circle */}
          <Circle
            cx={44}
            cy={44}
            r={radius}
            stroke={BRAND_COLORS.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Slices rotated around center (44, 44) starting from -90 deg (12 o'clock) */}
          {/* Easy Slice (Green) */}
          {easyLen > 0 && (
            <G transform="rotate(-90 44 44)">
              <Circle
                cx={44}
                cy={44}
                r={radius}
                stroke={BRAND_COLORS.successGreen}
                strokeWidth={strokeWidth}
                strokeDasharray={`${easyLen} ${circumference}`}
                fill="none"
              />
            </G>
          )}

          {/* Medium Slice (Amber) */}
          {medLen > 0 && (
            <G transform={`rotate(${-90 + (easyFrac * 360)} 44 44)`}>
              <Circle
                cx={44}
                cy={44}
                r={radius}
                stroke={BRAND_COLORS.warningAmber}
                strokeWidth={strokeWidth}
                strokeDasharray={`${medLen} ${circumference}`}
                fill="none"
              />
            </G>
          )}

          {/* Hard Slice (Red) */}
          {hardLen > 0 && (
            <G transform={`rotate(${-90 + ((easyFrac + medFrac) * 360)} 44 44)`}>
              <Circle
                cx={44}
                cy={44}
                r={radius}
                stroke={BRAND_COLORS.dangerRed}
                strokeWidth={strokeWidth}
                strokeDasharray={`${hardLen} ${circumference}`}
                fill="none"
              />
            </G>
          )}
        </Svg>

        {/* Center Percentage Display */}
        <View style={styles.centerTextBox}>
          <Text style={styles.centerPercentage}>{percentage}%</Text>
          <Text style={styles.centerLabel}>Overall</Text>
          <Text style={styles.centerSub}>{safeScore} / {safeMax} pts</Text>
        </View>
      </View>

      {/* Progress Bars Breakdown Alongside */}
      <View style={styles.barsContainer}>
        {/* Easy Bar */}
        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barLabelWrap}>
              <View style={[styles.legendDot, { backgroundColor: BRAND_COLORS.successGreen }]} />
              <Text style={styles.barLabel}>Easy</Text>
            </View>
            <Text style={styles.barScore}>{easyScore} / {easyMax} Pts ({easyPct}%)</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${easyPct}%`, backgroundColor: BRAND_COLORS.successGreen },
              ]}
            />
          </View>
        </View>

        {/* Medium Bar */}
        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barLabelWrap}>
              <View style={[styles.legendDot, { backgroundColor: BRAND_COLORS.warningAmber }]} />
              <Text style={styles.barLabel}>Medium</Text>
            </View>
            <Text style={styles.barScore}>{medScore} / {medMax} Pts ({medPct}%)</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${medPct}%`, backgroundColor: BRAND_COLORS.warningAmber },
              ]}
            />
          </View>
        </View>

        {/* Hard Bar */}
        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barLabelWrap}>
              <View style={[styles.legendDot, { backgroundColor: BRAND_COLORS.dangerRed }]} />
              <Text style={styles.barLabel}>Hard</Text>
            </View>
            <Text style={styles.barScore}>{hardScore} / {hardMax} Pts ({hardPct}%)</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${hardPct}%`, backgroundColor: BRAND_COLORS.dangerRed },
              ]}
            />
          </View>
        </View>

        {/* Total Evaluation Summary: Clean separate layout preventing any text overlap */}
        <View style={styles.totalSummaryCard}>
          <Text style={styles.totalLabel}>Total Evaluation</Text>
          <Text style={styles.totalValue}>{safeScore} / {safeMax} Pts ({percentage}%)</Text>
        </View>
      </View>
    </View>
  );
};
