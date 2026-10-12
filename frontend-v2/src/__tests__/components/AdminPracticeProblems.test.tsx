import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminProblemsPage from "@/app/admin/problems/page";
import { adminProblemsAPI, adminQuestionsAPI } from "@/config/api";

jest.mock("@/config/api", () => ({
  adminProblemsAPI: { getAll: jest.fn() },
  adminQuestionsAPI: { getAll: jest.fn() },
}));

const getProblems = jest.mocked(adminProblemsAPI.getAll);
const getQuestions = jest.mocked(adminQuestionsAPI.getAll);
const legacyResponse = { data: { problems: [{
  id: "practice-1", title: "Legacy Two Sum", slug: "two-sum", difficulty: "easy",
  categories: ["Arrays"], visibility: "Public",
}], pages: 1 } };
const bankResponse = { data: { questions: [
  { id: "bank-1", title: "Graph Paths", slug: "graph-paths", questionType: "DSA", status: "approved", difficulty: "hard", metadata: { categories: ["Graphs", "Traversal"] } },
  { id: "bank-draft", question: "Draft Tree Question", questionType: "coding", status: "draft", difficulty: "medium", topic: "Trees" },
  { id: "bank-private", title: "Private Coding Question", questionType: "algorithmic", status: "approved", metadata: { visibility: "Private", categories: ["Strings"] } },
  { id: "bank-duplicate", title: "Duplicate Two Sum", slug: "two-sum", questionType: "DSA", status: "approved" },
  { id: "mcq", title: "Array Quiz", questionType: "MCQ", status: "approved" },
  { id: "output", title: "Output Quiz", questionType: "CODE_OUTPUT", status: "approved" },
], pagination: { totalPages: 1 } } };

beforeEach(() => {
  jest.clearAllMocks();
  getProblems.mockResolvedValue(legacyResponse as Awaited<ReturnType<typeof adminProblemsAPI.getAll>>);
  getQuestions.mockResolvedValue(bankResponse as Awaited<ReturnType<typeof adminQuestionsAPI.getAll>>);
});

it("renders both existing records and eligible bank questions with their own editor links", async () => {
  render(<AdminProblemsPage />);
  expect(screen.getByText("Loading problems...")).toBeInTheDocument();
  const graph = await screen.findByText("Graph Paths");
  expect(screen.getByText("4 Problems")).toBeInTheDocument();
  expect(screen.queryByText("Array Quiz")).not.toBeInTheDocument();
  expect(screen.queryByText("Output Quiz")).not.toBeInTheDocument();
  expect(screen.queryByText("Duplicate Two Sum")).not.toBeInTheDocument();
  expect(screen.queryByText("/undefined")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Edit Legacy Two Sum" })).toHaveAttribute("href", "/admin/problems/practice-1/edit");
  expect(screen.getByRole("link", { name: "Edit Graph Paths" })).toHaveAttribute("href", "/admin/questions/bank-1/edit");
  expect(screen.getByRole("link", { name: "Create Problem" })).toHaveAttribute("href", "/admin/problems/create");
  const row = within(graph.closest("tr")!);
  expect(row.getByText("Graphs")).toBeVisible();
  expect(row.getByText("Traversal")).toBeVisible();
  expect(row.getByText("hard")).toBeVisible();
  expect(row.getByText("Published")).toBeVisible();
  expect(row.getByText("Question Bank")).toBeVisible();
  expect(within(screen.getByText("Draft Tree Question").closest("tr")!).getByText("Draft")).toBeVisible();
  expect(within(screen.getByText("Private Coding Question").closest("tr")!).getByText("Private")).toBeVisible();
});

it("searches titles, slugs, and bank topics and recovers after an empty search", async () => {
  render(<AdminProblemsPage />);
  await screen.findByText("Graph Paths");
  const input = screen.getByRole("textbox");
  for (const query of ["gRaPh PaTh", "graph-paths", "  traversal  "]) {
    fireEvent.change(input, { target: { value: query } });
    expect(screen.getByText("Graph Paths")).toBeVisible();
    expect(screen.queryByText("Legacy Two Sum")).not.toBeInTheDocument();
    expect(screen.getByText("1 Problem")).toBeInTheDocument();
  }
  fireEvent.change(input, { target: { value: "missing topic" } });
  expect(screen.getByText("No problems found")).toBeVisible();
  expect(screen.getByText("No practice problems or coding questions match your search.")).toBeVisible();
  fireEvent.change(input, { target: { value: "" } });
  expect(screen.getByText("4 Problems")).toBeInTheDocument();
});

it("retains successful results after one API fails and reloads both sources on retry", async () => {
  getQuestions.mockRejectedValueOnce(new Error("API unavailable"));
  render(<AdminProblemsPage />);
  expect(await screen.findByText("Legacy Two Sum")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Question Bank coding questions could not be loaded.");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByText("Loading problems...")).toBeInTheDocument();
  expect(await screen.findByText("Graph Paths")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(getProblems).toHaveBeenCalledTimes(2);
  expect(getQuestions).toHaveBeenCalledTimes(2);
});

it("shows a recoverable error when both APIs fail", async () => {
  getProblems.mockRejectedValueOnce(new Error("API unavailable"));
  getQuestions.mockRejectedValueOnce(new Error("API unavailable"));
  render(<AdminProblemsPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Existing practice problems could not be loaded.");
  expect(screen.getByRole("alert")).toHaveTextContent("Question Bank coding questions could not be loaded.");
  expect(screen.getByText("Retry loading the lists to see available problems.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
});

it("distinguishes a successful empty result from an API failure", async () => {
  getProblems.mockResolvedValueOnce({ data: { problems: [], pages: 0 } } as Awaited<ReturnType<typeof adminProblemsAPI.getAll>>);
  getQuestions.mockResolvedValueOnce({ data: { questions: [], pagination: { totalPages: 1 } } } as Awaited<ReturnType<typeof adminQuestionsAPI.getAll>>);
  render(<AdminProblemsPage />);
  expect(await screen.findByText("No practice problems or eligible coding questions are available yet.")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("aborts both source requests when the page unmounts", async () => {
  let resolveQuestions!: (value: Awaited<ReturnType<typeof adminQuestionsAPI.getAll>>) => void;
  getQuestions.mockReturnValueOnce(new Promise(resolve => { resolveQuestions = resolve; }));
  const { unmount } = render(<AdminProblemsPage />);
  const signal = getQuestions.mock.calls[0][1]!;
  expect(signal.aborted).toBe(false);
  expect(getProblems.mock.calls[0][1]).toBe(signal);
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => { resolveQuestions(bankResponse as Awaited<ReturnType<typeof adminQuestionsAPI.getAll>>); });
});

it("keeps results correct after React Strict Mode effect replay", async () => {
  render(<React.StrictMode><AdminProblemsPage /></React.StrictMode>);
  await waitFor(() => expect(screen.getByText("4 Problems")).toBeInTheDocument());
  expect(getQuestions.mock.calls[0][1]?.aborted).toBe(true);
  expect(getQuestions.mock.calls[1][1]?.aborted).toBe(false);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
