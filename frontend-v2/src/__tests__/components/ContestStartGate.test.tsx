import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ContestStartGate } from "@/app/contests/[id]/attempt/_components/ContestStartGate";
it("requires consent and real fullscreen before starting", async () => {
  const accept = jest.fn(); const request = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  render(<ContestStartGate onAccept={accept} requestFullscreen={request} isFullscreen={false} hasRequestedFullscreen={false} />);
  expect(screen.getByRole("button", { name: "Enter Fullscreen & Start" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Agree to contest rules" }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enter Fullscreen & Start" })));
  expect(request).toHaveBeenCalledTimes(1); expect(accept).not.toHaveBeenCalled();
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enter Fullscreen & Start" })));
  expect(accept).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
});
it("respects a contest configured without fullscreen", async () => {
  const accept = jest.fn(); const request = jest.fn();
  render(<ContestStartGate onAccept={accept} requestFullscreen={request} isFullscreen={false} hasRequestedFullscreen={false} requireFullscreen={false} />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Agree to contest rules" }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Start Contest" })));
  expect(accept).toHaveBeenCalledTimes(1); expect(request).not.toHaveBeenCalled();
});
