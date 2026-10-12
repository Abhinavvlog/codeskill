import { formatConstraints } from "@/lib/utils";

describe("formatConstraints Utility", () => {
  it("converts newline-separated textarea strings to an array of trimmed strings", () => {
    const input = "1 ≤ n ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9\n1 ≤ s.length ≤ 10^4";
    const result = formatConstraints(input);
    expect(result).toEqual([
      "1 ≤ n ≤ 10^5",
      "-10^9 ≤ nums[i] ≤ 10^9",
      "1 ≤ s.length ≤ 10^4",
    ]);
  });

  it("trims surrounding whitespace from individual constraint lines and ignores empty lines", () => {
    const input = "   1 ≤ n ≤ 10^5   \n\n\n  -10^9 ≤ nums[i] ≤ 10^9  \n   \n";
    const result = formatConstraints(input);
    expect(result).toEqual([
      "1 ≤ n ≤ 10^5",
      "-10^9 ≤ nums[i] ≤ 10^9",
    ]);
  });

  it("handles empty strings and whitespace-only strings by returning an empty array", () => {
    expect(formatConstraints("")).toEqual([]);
    expect(formatConstraints("   \n   \t  \n  ")).toEqual([]);
  });

  it("handles null and undefined safely", () => {
    expect(formatConstraints(null)).toEqual([]);
    expect(formatConstraints(undefined)).toEqual([]);
  });

  it("returns trimmed elements when given an array of strings", () => {
    const input = [" 1 ≤ n ≤ 10^5 ", "", "  -10^9 ≤ nums[i] ≤ 10^9  "];
    const result = formatConstraints(input);
    expect(result).toEqual([
      "1 ≤ n ≤ 10^5",
      "-10^9 ≤ nums[i] ≤ 10^9",
    ]);
  });

  it("handles invalid non-string, non-array types safely", () => {
    expect(formatConstraints(12345 as any)).toEqual([]);
    expect(formatConstraints({} as any)).toEqual([]);
  });
});
