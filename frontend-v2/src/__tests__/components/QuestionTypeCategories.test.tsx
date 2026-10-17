import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import BasicInfo from "@/app/admin/questions/create/_components/BasicInfo";
import { useQuestionStore } from "@/app/admin/questions/create/_store/useQuestionStore";
import { getQuestionTypeLabel, getTopicCategories, QUESTION_TYPES } from "@/lib/question-types";

beforeEach(() => useQuestionStore.getState().resetStore());

it("updates the immutable type chip for every type without changing topic categories or tags", () => {
  useQuestionStore.getState().updateMetadata({ categories: ["Arrays", "Trees"], tags: ["algorithms"] });
  render(<BasicInfo />);
  for (const type of QUESTION_TYPES) {
    fireEvent.change(screen.getByRole("combobox", { name: "Question Type" }), { target: { value: type.value } });
    const chip = screen.getByRole("status", { name: "Automatic question type" });
    expect(chip).toHaveTextContent(type.label);
    expect(within(chip).queryByRole("button")).toBeNull();
    expect(within(chip).queryByRole("textbox")).toBeNull();
    expect(useQuestionStore.getState().metadata.categories).toEqual(["Arrays", "Trees"]);
    expect(useQuestionStore.getState().metadata.tags).toEqual(["algorithms"]);
  }
  fireEvent.click(screen.getByText("2 selected"));
  fireEvent.click(screen.getByLabelText("Arrays"));
  expect(useQuestionStore.getState().metadata.categories).toEqual(["Trees"]);
  expect(screen.getByRole("status", { name: "Automatic question type" })).toHaveTextContent("Coding Problem");
});

it.each([["single_choice", "MCQ"], ["multiple_choice", "Multiple Choice"], ["true_false", "True/False"], ["code_output", "Code Output"], ["coding", "Coding Problem"], ["algorithmic", "Coding Problem"]])("displays legacy type %s consistently", (value, label) => {
  expect(getQuestionTypeLabel(value)).toBe(label);
});

it("reads all stored topics and falls back to legacy topic without inferring type from it", () => {
  expect(getTopicCategories({ metadata: { categories: ["Arrays", "Trees"] }, topic: "Arrays" })).toEqual(["Arrays", "Trees"]);
  expect(getTopicCategories({ topic: "Strings" })).toEqual(["Strings"]);
  expect(getTopicCategories({ metadata: { categories: [] }, topic: "General" })).toEqual([]);
  act(() => useQuestionStore.getState().setAllData({ metadata: { ...useQuestionStore.getState().metadata, questionType: "multiple_choice" as never } }));
  expect(useQuestionStore.getState().metadata.questionType).toBe("MULTIPLE_CHOICE");
});

it("shows Title and a separate Question field for MCQs while preserving coding labels", () => {
  act(() => useQuestionStore.getState().updateMetadata({ questionType: "MCQ" }));
  const { rerender } = render(<BasicInfo />);
  expect(screen.getByText("Title is required")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter the question shown to students")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Enter the question shown to students"), { target: { value: "Student-facing MCQ statement" } });
  expect(useQuestionStore.getState().statement.description).toBe("Student-facing MCQ statement");

  act(() => useQuestionStore.getState().updateMetadata({ questionType: "DSA" }));
  rerender(<BasicInfo />);
  expect(screen.getByText("Question Title")).toBeInTheDocument();
  expect(screen.queryByPlaceholderText("Enter the question shown to students")).not.toBeInTheDocument();
});

it("hydrates MCQ slug, statement, and stored option strings into the edit store", () => {
  const current = useQuestionStore.getState();
  act(() => current.setAllData({
    metadata: { ...current.metadata, title: "Java Inheritance", slug: "java-inheritance", questionType: "MCQ" },
    statement: { ...current.statement, description: "Which statement describes inheritance?" },
    options: ["A class inherits members", "Inheritance prevents reuse"],
    correctAnswer: 0,
  } as any));

  const state = useQuestionStore.getState();
  expect(state.metadata.slug).toBe("java-inheritance");
  expect(state.statement.description).toBe("Which statement describes inheritance?");
  expect(state.mcqOptions.map((option) => option.text)).toEqual(["A class inherits members", "Inheritance prevents reuse"]);
  expect(state.mcqOptions[0].isCorrect).toBe(true);
});
