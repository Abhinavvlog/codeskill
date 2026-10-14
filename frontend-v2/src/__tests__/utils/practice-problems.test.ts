import { adminProblemsAPI, adminQuestionsAPI } from "@/config/api";
import {
  filterPracticeProblems,
  loadPracticeProblems,
  mergePracticeProblems,
} from "@/lib/practice-problems";

jest.mock("@/config/api", () => ({
  adminProblemsAPI: { getAll: jest.fn() },
  adminQuestionsAPI: { getAll: jest.fn() },
}));

const legacyAPI = adminProblemsAPI.getAll as jest.Mock;
const bankAPI = adminQuestionsAPI.getAll as jest.Mock;
const legacyProblem = {
  id: "practice-1",
  title: "Existing Practice Problem",
  slug: "existing-practice",
  difficulty: "Easy",
  categories: ["Arrays"],
  visibility: "Private",
};
const bankQuestion = {
  id: "question-1",
  title: "Bank Coding Problem",
  slug: "bank-coding-problem",
  questionType: "DSA",
  question: "Legacy question title",
  difficulty: "medium",
  topic: "Arrays",
  metadata: { categories: ["Trees", "Graphs"], visibility: "Published" },
  status: "approved",
};

beforeEach(() => {
  jest.resetAllMocks();
  legacyAPI.mockResolvedValue({ data: { problems: [], pages: 1 } });
  bankAPI.mockResolvedValue({ data: { questions: [], pagination: { totalPages: 1 } } });
});

describe("Question Bank practice eligibility and actions", () => {
  it("retains existing practice details and normalizes bank details without copying records", () => {
    const original = JSON.stringify([legacyProblem, bankQuestion]);
    const rows = mergePracticeProblems([legacyProblem], [bankQuestion]);
    expect(rows).toHaveLength(2);
    expect(rows.find(row => row.id === "practice-1")).toEqual(expect.objectContaining({
      title: legacyProblem.title,
      slug: legacyProblem.slug,
      categories: ["Arrays"],
      visibility: "Private",
      source: "practice",
      editHref: "/admin/problems/practice-1/edit",
    }));
    expect(rows.find(row => row.id === "question-1")).toEqual(expect.objectContaining({
      title: bankQuestion.title,
      slug: bankQuestion.slug,
      categories: ["Trees", "Graphs"],
      visibility: "Published",
      source: "question-bank",
      editHref: "/admin/questions/question-1/edit",
    }));
    expect(rows.find(row => row.id === "question-1")?.difficulty.toLowerCase()).toBe("medium");
    expect(JSON.stringify([legacyProblem, bankQuestion])).toBe(original);
  });

  it.each(["DSA", "coding", "algorithmic", "dsa", "CODING", "Algorithmic"])("includes the supported coding alias %s", questionType => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, questionType }])).toHaveLength(1);
  });

  it.each(["MCQ", "single_choice", "MULTIPLE_CHOICE", "multiple_choice", "TRUE_FALSE", "true_false", "CODE_OUTPUT", "code_output", "subjective", "unknown", ""])("excludes unsupported type %s even if it has coding fields", questionType => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, questionType, problemStatement: "Coding-looking content", supportedLanguages: ["cpp"] }])).toEqual([]);
  });

  it("excludes archived bank questions while keeping eligible drafts", () => {
    const rows = mergePracticeProblems([], [
      { ...bankQuestion, id: "archived", status: "archived" },
      { ...bankQuestion, id: "draft", slug: "draft", status: "draft" },
    ]);
    expect(rows.map(row => row.id)).toEqual(["draft"]);
    expect(rows[0].visibility).toBe("Draft");
  });

  it("uses question text, legacy topic, and UUID for questions without a title or slug", () => {
    const rows = mergePracticeProblems([], [{ ...bankQuestion, title: undefined, slug: undefined, metadata: {} }]);
    expect(rows[0]).toEqual(expect.objectContaining({
      title: "Legacy question title",
      categories: ["Arrays"],
      editHref: "/admin/questions/question-1/edit",
    }));
    expect(rows[0].slug).toBeFalsy();
  });

  it.each([
    ["approved", "Published"], ["active", "Published"], ["published", "Published"],
    ["draft", "Draft"], ["pending", "Pending"], ["rejected", "Rejected"],
  ])("reflects persisted %s status as %s without changing publication", (status, visibility) => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, status }])[0].visibility).toBe(visibility);
  });

  it.each(["approved", "active", "published"])("does not infer publication from legacy %s status", status => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, status, metadata: { categories: ["Trees"] } }])[0].visibility).toBe("Draft");
  });

  it.each(["Public", "Published", " public ", "PUBLISHED"])("uses explicit metadata visibility %s for publication", visibility => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, metadata: { visibility } }])[0].visibility).toBe("Published");
  });

  it("supports explicit top-level visibility and respects an explicit nonpublic value", () => {
    expect(mergePracticeProblems([], [{ ...bankQuestion, visibility: "Public", metadata: {} }])[0].visibility).toBe("Published");
    expect(mergePracticeProblems([], [{ ...bankQuestion, visibility: "Draft" }])[0].visibility).toBe("Draft");
  });

  it("retains explicit Private visibility and does not present a draft as public", () => {
    const rows = mergePracticeProblems([], [
      { ...bankQuestion, id: "private", slug: "private", metadata: { categories: ["Trees"], visibility: "Private" } },
      { ...bankQuestion, id: "draft", slug: "draft", status: "draft", metadata: { visibility: "Published" } },
    ]);
    expect(rows.find(row => row.id === "private")?.visibility).toBe("Private");
    expect(rows.find(row => row.id === "draft")?.visibility).not.toBe("Published");
  });
});

describe("Practice source deduplication", () => {
  it.each([
    { id: legacyProblem.id, slug: "different-slug" },
    { id: "different-id", _id: legacyProblem.id, slug: "different-slug" },
    { id: "different-id", mongoId: "shared-mongo-id", slug: "different-slug" },
    { id: "different-id", slug: "  EXISTING-PRACTICE  " },
  ])("keeps the existing practice action when a bank question shares an identifier: %p", overlap => {
    const legacy = { ...legacyProblem, mongoId: "shared-mongo-id" };
    const rows = mergePracticeProblems([legacy], [{ ...bankQuestion, ...overlap }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].editHref).toBe("/admin/problems/practice-1/edit");
    expect(rows[0].source).toBe("practice");
  });

  it("retains distinct same-title questions and does not treat missing slugs as duplicates", () => {
    const rows = mergePracticeProblems(
      [{ ...legacyProblem, title: "Repeated title", slug: undefined }],
      [
        { ...bankQuestion, id: "q1", title: "Repeated title", slug: undefined },
        { ...bankQuestion, id: "q2", title: "Repeated title", slug: "" },
      ],
    );
    expect(rows).toHaveLength(3);
  });
});

describe("Practice loading and search", () => {
  it("fetches every source page so questions beyond the first page remain searchable", async () => {
    legacyAPI.mockImplementation(async ({ page }: { page: number }) => ({ data: {
      problems: [{ ...legacyProblem, id: `p${page}`, slug: `p${page}`, title: `Practice ${page}` }], pages: 2,
    } }));
    bankAPI.mockImplementation(async ({ page }: { page: number }) => ({ data: {
      questions: [{ ...bankQuestion, id: `q${page}`, slug: `q${page}`, title: `Bank ${page}` }], pagination: { totalPages: 3 },
    } }));
    const controller = new AbortController();
    const result = await loadPracticeProblems(controller.signal);
    expect(result.problems).toHaveLength(5);
    expect(result.errors).toEqual([]);
    expect(legacyAPI).toHaveBeenCalledTimes(2);
    expect(bankAPI).toHaveBeenCalledTimes(3);
    for (const call of legacyAPI.mock.calls) {
      expect(call[0]).toEqual(expect.objectContaining({ limit: 100 }));
      expect(call[1]).toBe(controller.signal);
    }
    for (const call of bankAPI.mock.calls) {
      expect(call[0]).toEqual(expect.objectContaining({ limit: 100, questionType: "DSA", status: "all" }));
      expect(call[1]).toBe(controller.signal);
    }
    expect(filterPracticeProblems(result.problems, "Bank 3").map(row => row.id)).toEqual(["q3"]);
  });

  it.each(["legacy", "bank"])("keeps the successful source when %s fails and returns an actionable error", async failedSource => {
    legacyAPI.mockResolvedValue({ data: { problems: [legacyProblem], pages: 1 } });
    bankAPI.mockResolvedValue({ data: { questions: [bankQuestion], pagination: { totalPages: 1 } } });
    (failedSource === "legacy" ? legacyAPI : bankAPI).mockRejectedValue(new Error("API unavailable"));
    const result = await loadPracticeProblems();
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0].source).toBe(failedSource === "legacy" ? "question-bank" : "practice");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(expect.any(String));
    expect(result.errors[0].length).toBeGreaterThan(0);
  });

  it("reports total failure separately from an empty successful response", async () => {
    expect(await loadPracticeProblems()).toEqual({ problems: [], errors: [] });
    legacyAPI.mockRejectedValue(new Error("offline"));
    bankAPI.mockRejectedValue(new Error("offline"));
    const failed = await loadPracticeProblems();
    expect(failed.problems).toEqual([]);
    expect(failed.errors).toHaveLength(2);
  });

  it("rejects cancellation before requests without reporting an API failure", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadPracticeProblems(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(legacyAPI).not.toHaveBeenCalled();
    expect(bankAPI).not.toHaveBeenCalled();
  });

  it("discards an in-flight cancelled response instead of returning partial results or fetching another page", async () => {
    const controller = new AbortController();
    let resolveLegacy!: (value: unknown) => void;
    legacyAPI.mockReturnValue(new Promise(resolve => { resolveLegacy = resolve; }));
    bankAPI.mockResolvedValue({ data: { questions: [bankQuestion], pagination: { totalPages: 1 } } });
    const request = loadPracticeProblems(controller.signal);
    controller.abort();
    resolveLegacy({ data: { problems: [legacyProblem], pages: 2 } });
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(legacyAPI).toHaveBeenCalledTimes(1);
    expect(bankAPI).toHaveBeenCalledTimes(1);
  });

  it("treats malformed source responses as failures while retaining the other source", async () => {
    legacyAPI.mockResolvedValue({ data: { problems: [legacyProblem], pages: 1 } });
    bankAPI.mockResolvedValue({ data: { questions: "invalid", pagination: { totalPages: 1 } } });
    const result = await loadPracticeProblems();
    expect(result.problems.map(row => row.id)).toEqual(["practice-1"]);
    expect(result.errors).toHaveLength(1);
  });

  it.each([" bank coding ", "BANK-CODING-PROBLEM", "graphs"])("searches title, slug, and topic case-insensitively: %s", search => {
    const rows = mergePracticeProblems([legacyProblem], [bankQuestion]);
    expect(filterPracticeProblems(rows, search).map(row => row.id)).toEqual(["question-1"]);
  });

  it("returns all rows for blank search and no rows for unmatched search", () => {
    const rows = mergePracticeProblems([legacyProblem], [bankQuestion]);
    expect(filterPracticeProblems(rows, "  ")).toEqual(rows);
    expect(filterPracticeProblems(rows, "nonexistent topic")).toEqual([]);
  });
});
