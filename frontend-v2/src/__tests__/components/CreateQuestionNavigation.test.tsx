import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import CreateQuestion from "@/app/admin/questions/create/page";
import { useQuestionStore } from "@/app/admin/questions/create/_store/useQuestionStore";
import { adminQuestionsAPI } from "@/config/api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock("@/config/api", () => ({ adminQuestionsAPI: { create: jest.fn().mockResolvedValue({}) } }));
jest.mock("@monaco-editor/react", () => ({ __esModule: true, default: () => <div /> }));

const scroll = jest.fn();
const observe = jest.fn();
const disconnect = jest.fn();
let onIntersection: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, "", "/admin/questions/create");
  useQuestionStore.getState().resetStore();
  HTMLElement.prototype.scrollIntoView = scroll;
  global.IntersectionObserver = jest.fn((callback, options) => {
    onIntersection = callback;
    observerOptions = options;
    return { observe, disconnect, unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
});

function mount() {
  const result = render(<main className="overflow-y-auto"><CreateQuestion /></main>);
  return { ...result, nav: within(result.container.querySelector("aside nav")!) };
}

it("scrolls every DSA item in both orders and selects it immediately", () => {
  const { nav, container } = mount();
  const buttons = nav.getAllByRole("button");
  expect(buttons).toHaveLength(12);
  expect(nav.getByRole("button", { name: "Examples" })).toBeInTheDocument();
  for (const button of [...buttons, ...[...buttons].reverse()]) {
    fireEvent.click(button);
    const id = useQuestionStore.getState().activeSection;
    const section = container.querySelector(`[id="${id}"]`);
    expect(section?.querySelector("h2")).toBeTruthy();
    expect(scroll.mock.instances.at(-1)).toBe(section);
    expect(scroll).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
    expect(button).toHaveAttribute("aria-current", "location");
  }
  expect(container.querySelector("form")).toHaveClass("[&>div[id]]:scroll-mt-[100px]");
});

it.each(["MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE", "CODE_OUTPUT"] as const)("supports %s sections and cleans up on type changes", (questionType) => {
  const { nav, unmount } = mount();
  fireEvent.click(nav.getByRole("button", { name: "Languages" }));
  act(() => useQuestionStore.getState().updateMetadata({ questionType }));
  expect(nav.queryByRole("button", { name: "Languages" })).toBeNull();
  expect(useQuestionStore.getState().activeSection).toBe("basic-info");
  for (const button of nav.getAllByRole("button")) {
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-current", "location");
  }
  expect(disconnect).toHaveBeenCalled();
  unmount();
  expect(disconnect).toHaveBeenCalledTimes(2);
});

it("tracks manual scrolling inside the admin main", () => {
  const { container, nav } = mount();
  expect(observerOptions?.root).toBe(container.querySelector("main"));
  act(() => onIntersection([{ isIntersecting: true, target: container.querySelector("#test-cases")! } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(nav.getByRole("button", { name: "Test Cases" })).toHaveAttribute("aria-current", "location");
});

it("safely ignores an unmounted target", () => {
  const { container, nav } = mount();
  container.querySelector("#languages")!.remove();
  fireEvent.click(nav.getByRole("button", { name: "Languages" }));
  expect(scroll).not.toHaveBeenCalled();
});

it("starts a fresh MCQ after an edit and again for each new create route", () => {
  // The normal create link has no type query; the persisted edit state carries MCQ.
  window.history.replaceState({}, "", "/admin/questions/create");
  act(() => {
    const state = useQuestionStore.getState();
    state.updateMetadata({ title: "Previously edited", slug: "previously-edited", questionType: "MCQ", difficulty: "Hard", points: 25, negativeMarks: 5, categories: ["Arrays"], tags: ["old"] });
    state.updateStatement({ description: "Old question statement" });
    state.updateMCQOptions([
      { text: "Old correct", isCorrect: true, explanation: "Old option note" },
      { text: "Old option", isCorrect: false, explanation: "" },
    ]);
    state.updateSolutionExplanation({ content: "Old explanation" });
    state.updatePublishing({ contestOnly: true, isFeatured: true });
  });

  const first = mount();
  expect(useQuestionStore.getState()).toMatchObject({
    metadata: { title: "", slug: "", questionType: "MCQ", difficulty: "Easy", points: 100, negativeMarks: 0, categories: [], tags: [] },
    statement: { description: "" },
    mcqOptions: [
      { text: "", isCorrect: true, explanation: "" },
      { text: "", isCorrect: false, explanation: "" },
      { text: "", isCorrect: false, explanation: "" },
      { text: "", isCorrect: false, explanation: "" },
    ],
    solutionExplanation: { content: "" },
    publishing: { contestOnly: false, isFeatured: false },
  });

  // Ordinary edits after initialization remain in place while the user fills the form.
  act(() => useQuestionStore.getState().updateMetadata({ title: "New MCQ", slug: "new-mcq" }));
  expect(useQuestionStore.getState().metadata.title).toBe("New MCQ");
  first.unmount();

  const second = mount();
  expect(useQuestionStore.getState().metadata).toMatchObject({ title: "", slug: "", questionType: "MCQ", difficulty: "Easy", categories: [], tags: [] });
  expect(useQuestionStore.getState().statement.description).toBe("");
  expect(useQuestionStore.getState().mcqOptions[0]).toMatchObject({ text: "", isCorrect: true, explanation: "" });
  second.unmount();
});

it("keeps draft saving and publishing functional", async () => {
  act(() => useQuestionStore.getState().updateMetadata({ title: "Example", slug: "example", questionType: "CODE_OUTPUT" }));
  act(() => useQuestionStore.getState().updateCodeOutput({ expectedOutput: "42" }));
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
  expect(useQuestionStore.getState().lastSaved).toBeTruthy();
  expect(adminQuestionsAPI.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Publish to Question Bank" }));
  await waitFor(() => expect(adminQuestionsAPI.create).toHaveBeenCalledWith(expect.objectContaining({ question: "Example", questionType: "CODE_OUTPUT", expectedOutput: "42" })));
});

it("publishes authored examples independently of public and hidden judge cases", async () => {
  mount();
  act(() => {
    const state = useQuestionStore.getState();
    state.updateMetadata({ title: "Separate examples", slug: "separate-examples", questionType: "DSA" });
    state.setAllData({ testCases: [
      { id: "public", input: "judge input", output: "judge output", isHidden: false, explanation: "", weight: 1 },
      { id: "hidden", input: "secret", output: "secret answer", isHidden: true, explanation: "", weight: 1 },
    ] });
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Example" }));
  fireEvent.change(screen.getByLabelText("Example 1 input"), { target: { value: "example input" } });
  fireEvent.change(screen.getByLabelText("Example 1 output"), { target: { value: "example output" } });
  fireEvent.change(screen.getByLabelText("Example 1 explanation"), { target: { value: "Explain the example" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish to Question Bank" }));
  await waitFor(() => expect(adminQuestionsAPI.create).toHaveBeenCalledWith(expect.objectContaining({
    examples: [{ input: "example input", output: "example output", explanation: "Explain the example" }],
    testCases: [
      expect.objectContaining({ input: "judge input", expectedOutput: "judge output", isHidden: false }),
      expect.objectContaining({ input: "secret", expectedOutput: "secret answer", isHidden: true }),
    ],
  })));
});
