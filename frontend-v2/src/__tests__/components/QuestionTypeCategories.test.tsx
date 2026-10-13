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
