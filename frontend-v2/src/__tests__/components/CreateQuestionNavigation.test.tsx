import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import CreateQuestion from "@/app/admin/questions/create/page";
import { useQuestionStore } from "@/app/admin/questions/create/_store/useQuestionStore";
import { adminQuestionsAPI } from "@/config/api";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/config/api", () => ({ adminQuestionsAPI: { create: jest.fn().mockResolvedValue({}) } }));
jest.mock("@monaco-editor/react", () => ({ __esModule: true, default: () => <div /> }));

const scroll = jest.fn();
const observe = jest.fn();
const disconnect = jest.fn();
let onIntersection: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;

beforeEach(() => {
  jest.clearAllMocks();
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
