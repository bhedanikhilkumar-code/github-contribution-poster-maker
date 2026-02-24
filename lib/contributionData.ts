export type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export interface ContributionDay {
  contributionCount: number;
  contributionLevel: ContributionLevel;
  date: string;
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionApiResponse {
  totalContributions: number;
  weeks: ContributionWeek[];
}

const LEVEL_MAP: Record<ContributionLevel, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};

export function contributionWeeksToGrid(weeks: ContributionWeek[]): number[][] {
  const rows = 7;
  const cols = weeks.length;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      if (day.weekday >= 0 && day.weekday < rows) {
        grid[day.weekday][weekIndex] = LEVEL_MAP[day.contributionLevel];
      }
    });
  });

  return grid;
}
