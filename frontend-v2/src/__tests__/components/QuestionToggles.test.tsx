import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ExecutionSettings from "@/app/admin/questions/create/_components/ExecutionSettings";
import CustomChecker from "@/app/admin/questions/create/_components/CustomChecker";
import PublishingSection from "@/app/admin/questions/create/_components/PublishingSection";
import { useQuestionStore } from "@/app/admin/questions/create/_store/useQuestionStore";

jest.mock("@/components/editor/MonacoEditor", () => ({ MonacoEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <textarea aria-label="Checker code" value={value} onChange={(event) => onChange(event.target.value)} /> }));

beforeEach(() => useQuestionStore.getState().resetStore());

it("toggles every execution switch repeatedly by label without submitting", () => {
  const submit = jest.fn((event) => event.preventDefault());
  render(<form onSubmit={submit}><ExecutionSettings /></form>);
  for (const [name, key] of [["Enable Custom Input", "enableCustomInput"], ["Allow Multiple Files", "allowMultipleFiles"], ["Enable File Upload", "enableFileUpload"]] as const) {
    const input = screen.getByRole("switch", { name });
    for (let index = 0; index < 6; index++) {
      const before = useQuestionStore.getState().execution[key];
      fireEvent.click(screen.getByText(name));
      expect(useQuestionStore.getState().execution[key]).toBe(!before);
      expect(input).toHaveProperty("checked", !before);
    }
    input.focus();
    expect(input).toHaveFocus();
    act(() => useQuestionStore.getState().updateExecution({ [key]: true }));
    expect(input).toBeChecked();
  }
  expect(submit).not.toHaveBeenCalled();
});

it("uses loaded custom checker state and saves toggles, language, and code to that same store", () => {
  useQuestionStore.getState().updateCustomChecker({ enabled: true, language: "python", code: "print(42)" });
  render(<CustomChecker />);
  const input = screen.getByRole("switch", { name: "Enable Custom Checker" });
  expect(input).toBeChecked();
  expect(screen.getByLabelText("Checker code")).toHaveValue("print(42)");
  for (let index = 0; index < 6; index++) {
    fireEvent.click(screen.getByText("Enable Custom Checker"));
    expect(input).toHaveProperty("checked", useQuestionStore.getState().customChecker.enabled);
    expect(screen.queryByLabelText("Checker code") !== null).toBe(useQuestionStore.getState().customChecker.enabled);
  }
  fireEvent.click(screen.getByRole("button", { name: "Java" }));
  fireEvent.change(screen.getByLabelText("Checker code"), { target: { value: "checker" } });
  expect(useQuestionStore.getState().customChecker).toEqual({ enabled: true, language: "java", code: "checker" });
  act(() => useQuestionStore.getState().updateCustomChecker({ enabled: false }));
  expect(input).not.toBeChecked();
});

it("keeps publishing toggles synchronized with external updates and repeated label clicks", () => {
  render(<PublishingSection />);
  for (const name of ["Archive", "Featured", "Contest Only", "Practice Only"]) {
    const input = screen.getByRole("checkbox", { name });
    for (let index = 0; index < 6; index++) {
      const before = (input as HTMLInputElement).checked;
      fireEvent.click(screen.getByText(name));
      expect(input).toHaveProperty("checked", !before);
    }
    input.focus();
    expect(input).toHaveFocus();
  }
  act(() => useQuestionStore.getState().updatePublishing({ isFeatured: true }));
  expect(screen.getByRole("checkbox", { name: "Featured" })).toBeChecked();
});
