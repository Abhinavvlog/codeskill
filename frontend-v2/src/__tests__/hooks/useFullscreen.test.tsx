import { act, renderHook } from '@testing-library/react';
import { useFullscreen } from '@/hooks/anti-cheat/useFullscreen';
const active = (value: Element | null) => Object.defineProperty(document, 'fullscreenElement', { configurable: true, value });
beforeEach(() => { active(null); Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: undefined }); });
afterEach(() => jest.restoreAllMocks());
it('does not claim fullscreen when the API is missing or fails to enter', async () => {
  const { result } = renderHook(() => useFullscreen({ enabled: true, onViolation: jest.fn() }));
  await expect(result.current.requestFullscreen()).rejects.toThrow('unavailable');
  expect(result.current.isFullscreen).toBe(false);
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: jest.fn().mockResolvedValue(undefined) });
  await expect(result.current.requestFullscreen()).rejects.toThrow('required');
  expect(result.current.hasRequested).toBe(false);
});
it('tracks actual entry and counts overlapping vendor exit events only once', async () => {
  const onViolation = jest.fn();
  const { result } = renderHook(() => useFullscreen({ enabled: true, onViolation }));
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: jest.fn(async () => { active(document.documentElement); }) });
  await act(async () => result.current.requestFullscreen());
  expect(result.current.isFullscreen).toBe(true);
  act(() => { active(null); document.dispatchEvent(new Event('fullscreenchange')); document.dispatchEvent(new Event('webkitfullscreenchange')); });
  expect(onViolation).toHaveBeenCalledTimes(1);
  expect(result.current.isFullscreen).toBe(false);
});
it('monitors fullscreen inherited from the briefing and avoids warnings after completion', () => {
  active(document.documentElement);
  const onViolation = jest.fn();
  const { result, rerender } = renderHook(({ enabled }) => useFullscreen({ enabled, onViolation }), { initialProps: { enabled: true } });
  expect(result.current.isFullscreen).toBe(true);
  expect(result.current.hasRequested).toBe(true);
  rerender({ enabled: false });
  act(() => { active(null); document.dispatchEvent(new Event('fullscreenchange')); });
  expect(onViolation).not.toHaveBeenCalled();
});
it('propagates permission denial without enabling the test', async () => {
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: jest.fn().mockRejectedValue(new Error('Denied')) });
  const { result } = renderHook(() => useFullscreen({ enabled: true, onViolation: jest.fn() }));
  await expect(result.current.requestFullscreen()).rejects.toThrow('Denied');
  expect(result.current.isFullscreen).toBe(false);
});
