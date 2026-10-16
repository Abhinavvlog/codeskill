import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AntiCheatWarningDialog } from '@/app/contests/[id]/attempt/_components/AntiCheatWarningDialog';
beforeEach(() => Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null }));
it('keeps the contest locked when fullscreen is denied, then allows a successful retry', async () => {
  const onClose = jest.fn();
  const request = jest.fn().mockRejectedValueOnce(new Error('Permission denied')).mockImplementationOnce(async () => { Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement }); });
  render(<AntiCheatWarningDialog isOpen onClose={onClose} warnings={1} warningLimit={3} lastViolation="Fullscreen_Exit" requestFullscreen={request} isFullscreen={false} />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'I Understand, Return to Contest' })));
  expect(onClose).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'I Understand, Return to Contest' })));
  expect(onClose).toHaveBeenCalledTimes(1);
});
it('does not require fullscreen when the contest policy disables it', async () => {
  const onClose = jest.fn(), request = jest.fn();
  render(<AntiCheatWarningDialog isOpen onClose={onClose} warnings={1} warningLimit={3} lastViolation="TabSwitch_WindowBlur" requestFullscreen={request} isFullscreen={false} requireFullscreen={false} />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'I Understand, Return to Contest' })));
  expect(onClose).toHaveBeenCalledTimes(1); expect(request).not.toHaveBeenCalled();
});
