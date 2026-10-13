export interface PublicProblem {
  id: string;
  slug?: string;
  title: string;
  difficulty: string;
  categories: string[];
  status?: string;
  stats: { acceptanceRate: number };
}

export interface PublicProblemList {
  problems: PublicProblem[];
  total: number;
  totalPages: number;
}

const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

export function normalizeProblemQuery(value: unknown, isCategory = false): string | undefined {
  const normalized = text(value);
  if (!normalized || ["undefined", "null"].includes(normalized.toLowerCase()) || (isCategory && normalized.toLowerCase() === "all topics")) return undefined;
  return normalized;
}

function nonNegativeInteger(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

export function parsePublicProblemList(payload: unknown, limit = 20): PublicProblemList {
  const body = record(payload);
  const rows = Array.isArray(payload) ? payload : body?.data ?? body?.problems;
  if (!Array.isArray(rows)) throw new Error("Invalid problems response");

  const problems = rows.map(value => {
    const problem = record(value);
    const id = text(problem?.id) || text(problem?._id) || text(problem?.slug);
    if (!problem || !id) throw new Error("Invalid problem record");
    const rawDifficulty = text(problem.difficulty);
    const difficultyKey = rawDifficulty.toLowerCase();
    const difficulty = ["easy", "medium", "hard"].includes(difficultyKey) ? difficultyKey[0].toUpperCase() + difficultyKey.slice(1) : rawDifficulty || "Unknown";
    const acceptanceRate = Number(record(problem.stats)?.acceptanceRate ?? 0);
    return {
      id,
      slug: text(problem.slug) || undefined,
      title: text(problem.title) || "Untitled problem",
      difficulty,
      categories: Array.isArray(problem.categories) ? problem.categories.map(text).filter(Boolean) : [],
      status: text(problem.status) || undefined,
      stats: { acceptanceRate: Number.isFinite(acceptanceRate) ? acceptanceRate : 0 },
    };
  });
  const pagination = record(body?.pagination);
  const total = nonNegativeInteger(body?.total ?? pagination?.total) ?? problems.length;
  const totalPages = Math.max(1, nonNegativeInteger(body?.totalPages ?? body?.pages ?? pagination?.totalPages) ?? Math.ceil(total / limit));
  return { problems, total, totalPages };
}
