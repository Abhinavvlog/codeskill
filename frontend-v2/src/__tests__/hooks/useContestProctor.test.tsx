import { act, renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { useAntiCheatMaster } from "@/hooks/anti-cheat/useAntiCheatMaster";
import api from "@/config/api";
jest.mock("@/config/api", () => ({ __esModule: true, default: { post: jest.fn().mockResolvedValue({ data: { success: true } }) } }));
jest.mock("socket.io-client", () => ({ io: () => ({ on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() }) }));
const config = { enableFullscreen: false, enableCopyProtect: false, enablePasteProtect: false, enableDevToolsDetect: false, enableTabSwitchDetect: false, warningLimit: 2 };
beforeEach(() => jest.clearAllMocks());
it("records only active proctoring violations with the persisted session and stops listeners after completion", async () => {
  const finish = jest.fn();
  const { result, rerender } = renderHook(({ enabled }) => useAntiCheatMaster("contest", "student", "session", config, finish, enabled), { initialProps: { enabled: true } });
  await act(async () => fireEvent.keyDown(window, { key: "F12" }));
  expect(api.post).toHaveBeenCalledWith("/contests/contest/violations", { sessionId: "session", type: "Keyboard_DevTools", metadata: {} });
  expect(result.current.warnings).toBe(1); expect(finish).not.toHaveBeenCalled();
  await act(async () => fireEvent.keyDown(window, { key: "F12" })); expect(finish).toHaveBeenCalledTimes(1);
  rerender({ enabled: false }); await act(async () => fireEvent.keyDown(window, { key: "F12" }));
  expect(api.post).toHaveBeenCalledTimes(2);
});
it("retains warnings without forcing submission when the contest configuration disables it", async () => {
  const finish = jest.fn();
  renderHook(() => useAntiCheatMaster("contest", "student", "session", { ...config, warningLimit: 1, autoSubmitOnViolation: false }, finish));
  await act(async () => fireEvent.keyDown(window, { key: "F12" })); expect(finish).not.toHaveBeenCalled();
});
