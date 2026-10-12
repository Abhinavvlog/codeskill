import { adminProblemsAPI, adminQuestionsAPI } from "@/config/api";
import { getTopicCategories } from "@/lib/question-types";

interface RecordIdentity {
  id?: string;
  _id?: string;
  mongoId?: string;
  slug?: string;
  createdAt?: string;
}

export interface LegacyPracticeRecord extends RecordIdentity {
  title?: string;
  difficulty?: string;
  categories?: string[];
  visibility?: string;
}

export interface CodingBankRecord extends RecordIdentity {
  title?: string;
  question?: string;
  difficulty?: string;
  questionType?: string;
  status?: string;
  topic?: string;
  categories?: string[];
  visibility?: string;
  metadata?: { categories?: string[]; visibility?: string };
}

export interface PracticeRow {
  id: string;
  title: string;
  slug?: string;
  difficulty: string;
  categories: string[];
  visibility: string;
  source: "practice" | "question-bank";
  editHref: string;
  createdAt?: string;
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const identities = (record: RecordIdentity) => [record.id, record._id, record.mongoId].map(text).filter(Boolean);
const slugKey = (record: RecordIdentity) => text(record.slug).toLowerCase();
const topics = (values: string[]) => [...new Set(values.map(text).filter(Boolean))];

function bankVisibility(question: CodingBankRecord): string {
  const status = text(question.status).toLowerCase();
  if (["approved", "active", "published"].includes(status)) {
    const visibility = text(question.metadata?.visibility || question.visibility).toLowerCase();
    return visibility === "private" ? "Private" : "Published";
  }
  return ({ draft: "Draft", pending: "Pending", rejected: "Rejected", private: "Private" } as Record<string, string>)[status] || "Unknown";
}

export function mergePracticeProblems(legacy: LegacyPracticeRecord[], questions: CodingBankRecord[]): PracticeRow[] {
  const seenIds = new Set<string>();
  const legacySlugs = new Set<string>();
  const result: PracticeRow[] = [];

  for (const problem of legacy) {
    const ids = identities(problem);
    if (!ids.length || ids.some(id => seenIds.has(id))) continue;
    ids.forEach(id => seenIds.add(id));
    const slug = slugKey(problem);
    if (slug) legacySlugs.add(slug);
    result.push({
      id: ids[0], title: text(problem.title) || "Untitled problem", slug: text(problem.slug) || undefined,
      difficulty: text(problem.difficulty) || "Unknown", categories: topics(Array.isArray(problem.categories) ? problem.categories : []),
      visibility: text(problem.visibility) || "Unknown", source: "practice",
      editHref: `/admin/problems/${encodeURIComponent(ids[0])}/edit`, createdAt: problem.createdAt,
    });
  }

  for (const question of questions) {
    if (!["dsa", "coding", "algorithmic"].includes(text(question.questionType).toLowerCase()) || text(question.status).toLowerCase() === "archived") continue;
    const ids = identities(question);
    if (!ids.length || ids.some(id => seenIds.has(id)) || (slugKey(question) && legacySlugs.has(slugKey(question)))) continue;
    ids.forEach(id => seenIds.add(id));
    result.push({
      id: ids[0], title: text(question.title) || text(question.question) || "Untitled coding question",
      slug: text(question.slug) || undefined, difficulty: text(question.difficulty) || "Unknown",
      categories: topics(getTopicCategories(question)), visibility: bankVisibility(question), source: "question-bank",
      editHref: `/admin/questions/${encodeURIComponent(ids[0])}/edit`, createdAt: question.createdAt,
    });
  }

  return result.sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

export function filterPracticeProblems(rows: PracticeRow[], search: string): PracticeRow[] {
  const query = search.trim().toLowerCase();
  return rows.filter(row => [row.title, row.slug || "", ...row.categories].some(value => value.toLowerCase().includes(query)));
}

function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

async function loadPages<T>(fetchPage: (page: number) => Promise<{ data: unknown }>, field: "problems" | "questions", signal?: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    checkCancelled(signal);
    const response = await fetchPage(page);
    checkCancelled(signal);
    const body = object(response.data);
    const items = Array.isArray(response.data) ? response.data : body?.[field] ?? body?.data;
    if (!Array.isArray(items)) throw new Error("Unexpected list response");
    rows.push(...items.filter(item => object(item)) as T[]);
    if (page === 1 && body) {
      const pagination = object(body.pagination);
      const count = Number(pagination?.totalPages ?? body.pages ?? body.totalPages ?? 1);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid pagination response");
      pages = Math.max(1, count);
    }
  }
  return rows;
}

export async function loadPracticeProblems(signal?: AbortSignal): Promise<{ problems: PracticeRow[]; errors: string[] }> {
  checkCancelled(signal);
  const [legacy, bank] = await Promise.allSettled([
    loadPages<LegacyPracticeRecord>(page => adminProblemsAPI.getAll({ page, limit: 100 }, signal), "problems", signal),
    loadPages<CodingBankRecord>(page => adminQuestionsAPI.getAll({ page, limit: 100, questionType: "DSA", status: "all" }, signal), "questions", signal),
  ]);
  checkCancelled(signal);
  const errors: string[] = [];
  if (legacy.status === "rejected") errors.push("Existing practice problems could not be loaded.");
  if (bank.status === "rejected") errors.push("Question Bank coding questions could not be loaded.");
  return {
    problems: mergePracticeProblems(legacy.status === "fulfilled" ? legacy.value : [], bank.status === "fulfilled" ? bank.value : []),
    errors,
  };
}
