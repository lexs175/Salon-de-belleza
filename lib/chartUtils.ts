export const AvailableChartColors = [
  "emerald",
  "rose",
  "blue",
  "amber",
  "violet",
  "cyan",
  "indigo",
  "teal",
] as const;

export type AvailableChartColorsKeys = (typeof AvailableChartColors)[number];

export const constructCategoryColors = (
  categories: string[],
  colors: readonly AvailableChartColorsKeys[] | AvailableChartColorsKeys[]
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>();
  categories.forEach((category, idx) => {
    categoryColors.set(category, colors[idx % colors.length]);
  });
  return categoryColors;
};

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: "bg" | "stroke" | "fill" | "text"
): string => {
  const colorMap: Record<AvailableChartColorsKeys, Record<string, string>> = {
    emerald: {
      bg: "bg-emerald-500",
      stroke: "stroke-emerald-600",
      fill: "fill-emerald-500",
      text: "text-emerald-600",
    },
    rose: {
      bg: "bg-rose-500",
      stroke: "stroke-rose-500",
      fill: "fill-rose-500",
      text: "text-rose-500",
    },
    blue: {
      bg: "bg-blue-500",
      stroke: "stroke-blue-500",
      fill: "fill-blue-500",
      text: "text-blue-500",
    },
    amber: {
      bg: "bg-amber-500",
      stroke: "stroke-amber-500",
      fill: "fill-amber-500",
      text: "text-amber-500",
    },
    violet: {
      bg: "bg-violet-500",
      stroke: "stroke-violet-500",
      fill: "fill-violet-500",
      text: "text-violet-500",
    },
    cyan: {
      bg: "bg-cyan-500",
      stroke: "stroke-cyan-500",
      fill: "fill-cyan-500",
      text: "text-cyan-500",
    },
    indigo: {
      bg: "bg-indigo-500",
      stroke: "stroke-indigo-500",
      fill: "fill-indigo-500",
      text: "text-indigo-500",
    },
    teal: {
      bg: "bg-teal-500",
      stroke: "stroke-teal-500",
      fill: "fill-teal-500",
      text: "text-teal-500",
    },
  };
  return colorMap[color]?.[type] || "";
};

export const getYAxisDomain = (
  autoMinValue?: boolean,
  minValue?: number,
  maxValue?: number
): [number | "auto", number | "auto"] => {
  const min = autoMinValue ? "auto" : minValue ?? 0;
  const max = maxValue ?? "auto";
  return [min, max];
};

export const hasOnlyOneValueForKey = (
  data: Record<string, any>[],
  key: string
): boolean => {
  const values = new Set();
  for (const item of data) {
    if (item[key] !== undefined && item[key] !== null) {
      values.add(item[key]);
      if (values.size > 1) return false;
    }
  }
  return true;
};
