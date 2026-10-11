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
    padding: 10,
  },
  chartWrapper: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerTextBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    height: 70,
  },
  centerPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
    textAlign: "center",
  },
  centerLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: BRAND_COLORS.slateMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  centerSub: {
    fontSize: 6.5,
    color: BRAND_COLORS.slateLight,
    marginTop: 1,
  },
  barsContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  barRow: {
    marginBottom: 6,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2.5,
  },
  barLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  barLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: BRAND_COLORS.slateText,
  },
  barScore: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
  },
  barTrack: {
    width: "100%",
    height: 5,
    backgroundColor: BRAND_COLORS.borderLight,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  totalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.borderLight,
    paddingTop: 4,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: BRAND_COLORS.navyDark,
  },
  totalValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: BRAND_COLORS.cuRed,
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
  const safeMax = Math.max(1, maxScore);
  const percentage = Math.round((score / safeMax) * 100);

  // Circle geometry for Donut
  const radius = 37;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius; // ~232.48

  // Calculate arc slices proportionally based on max marks weight
  const safeEasyMax = Math.max(0, easyMax);
  const safeMedMax = Math.max(0, medMax);
  const safeHardMax = Math.max(0, hardMax);
  const sumMax = Math.max(1, safeEasyMax + safeMedMax + safeHardMax);

  // Normalized fractions for each category ring
  const easyFrac = (safeEasyMax / sumMax) * Math.min(1, Math.max(0, easyScore / Math.max(1, safeEasyMax)));
  const medFrac = (safeMedMax / sumMax) * Math.min(1, Math.max(0, medScore / Math.max(1, safeMedMax)));
  const hardFrac = (safeHardMax / sumMax) * Math.min(1, Math.max(0, hardScore / Math.max(1, safeHardMax)));

  const easyLen = easyFrac * circumference;
  const medLen = medFrac * circumference;
  const hardLen = hardFrac * circumference;

  const easyPct = safeEasyMax > 0 ? Math.round((easyScore / safeEasyMax) * 100) : 0;
  const medPct = safeMedMax > 0 ? Math.round((medScore / safeMedMax) * 100) : 0;
  const hardPct = safeHardMax > 0 ? Math.round((hardScore / safeHardMax) * 100) : 0;

  return (
    <View style={styles.container} wrap={false}>
      {/* Donut Chart Visual */}
      <View style={styles.chartWrapper}>
        <Svg width={96} height={96} viewBox="0 0 96 96">
          {/* Background Track Circle */}
          <Circle
            cx={48}
            cy={48}
            r={radius}
            stroke={BRAND_COLORS.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Slices rotated around center (48, 48) starting from -90 deg (12 o'clock) */}
          {/* Easy Slice (Green) */}
          {easyLen > 0 && (
            <G transform="rotate(-90 48 48)">
              <Circle
                cx={48}
                cy={48}
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
            <G transform={`rotate(${-90 + (easyFrac * 360)} 48 48)`}>
              <Circle
                cx={48}
                cy={48}
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
            <G transform={`rotate(${-90 + ((easyFrac + medFrac) * 360)} 48 48)`}>
              <Circle
                cx={48}
                cy={48}
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
          <Text style={styles.centerSub}>{score} / {maxScore} pts</Text>
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

        {/* Summary Footer Line */}
        <View style={styles.totalSummaryRow}>
          <Text style={styles.totalLabel}>Total Evaluation Marks</Text>
          <Text style={styles.totalValue}>{score} / {maxScore} Pts ({percentage}%)</Text>
        </View>
      </View>
    </View>
  );
};
