export type ScaleDef = { id: string; name: string; intervals: number[]; degreeLabels: string[] };

export const SCALES: Record<string, ScaleDef> = {
  major: {
    id: "major",
    name: "Major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeLabels: ["1", "2", "3", "4", "5", "6", "7"],
  },
  harmonicMinor: {
    id: "harmonicMinor",
    name: "Harmonic Minor",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degreeLabels: ["1", "2", "b3", "4", "5", "b6", "7"],
  },
};
