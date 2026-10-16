import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import SafeExamBrowser from "@/components/assessment/SafeExamBrowser";

jest.mock("react-hot-toast", () => ({ toast: { error: jest.fn() } }));

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement });
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  jest.spyOn(document, "hasFocus").mockReturnValue(true);
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

it("counts overlapping window and tab events once per departure and terminates at the configured limit", () => {
  const violation = jest.fn();
  const terminate = jest.fn();
  render(<SafeExamBrowser maxWarnings={2} onViolation={violation} onTerminate={terminate}><div>Exam</div></SafeExamBrowser>);
  fireEvent.blur(window);
  Object.defineProperty(document, "hidden", { configurable: true, value: true });
  fireEvent(document, new Event("visibilitychange"));
  act(() => jest.advanceTimersByTime(1000));
  expect(violation).toHaveBeenCalledTimes(1);
  expect(terminate).not.toHaveBeenCalled();
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  fireEvent.focus(window);
  fireEvent.blur(window);
  expect(violation).toHaveBeenCalledTimes(2);
  expect(terminate).toHaveBeenCalledTimes(1);
});

it("detects lost focus via polling and removes monitoring after completion", () => {
  const violation = jest.fn();
  const { rerender } = render(<SafeExamBrowser onViolation={violation}><div>Exam</div></SafeExamBrowser>);
  jest.mocked(document.hasFocus).mockReturnValue(false);
  act(() => jest.advanceTimersByTime(500));
  expect(violation).toHaveBeenCalledTimes(1);
  rerender(<SafeExamBrowser isEnabled={false} onViolation={violation}><div>Exam</div></SafeExamBrowser>);
  fireEvent.blur(window);
  act(() => jest.advanceTimersByTime(1000));
  expect(violation).toHaveBeenCalledTimes(1);
});

it("does not warn before the student enters fullscreen", () => {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  const violation = jest.fn();
  render(<SafeExamBrowser onViolation={violation}><div>Exam</div></SafeExamBrowser>);
  fireEvent.blur(window);
  expect(violation).not.toHaveBeenCalled();
});

it("keeps answers inert before fullscreen and after exit, and starts only after real entry", async () => {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  const start = jest.fn();
  Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: jest.fn(async () => { Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement }); }) });
  const { getByText, getByRole } = render(<SafeExamBrowser onFullscreenEntered={start}><button>Choose answer</button></SafeExamBrowser>);
  expect(getByText("Choose answer").closest('[inert]')).not.toBeNull();
  expect(start).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(getByRole("button", { name: "Enter Fullscreen to Continue" })); });
  expect(start).toHaveBeenCalledTimes(1);
  expect(getByText("Choose answer").closest('[inert]')).toBeNull();
  act(() => { Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null }); document.dispatchEvent(new Event("fullscreenchange")); });
  expect(getByText("Choose answer").closest('[inert]')).not.toBeNull();
});
