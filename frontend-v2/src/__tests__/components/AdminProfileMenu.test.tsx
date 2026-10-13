import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn();
const mockUpdateUser = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: jest.fn(() => "/admin/dashboard"),
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/config/api", () => ({ authAPI: { getMe: jest.fn() } }));
jest.mock("@/components/admin/AdminSidebar", () => ({ AdminSidebar: () => <aside>Admin navigation</aside> }));
jest.mock("@/components/admin/AdminLogo", () => ({ AdminLogo: () => <span>CodeSkill logo</span> }));
jest.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

const admin = { _id: "admin-1", name: "Ananya Rao Operations", email: "ananya@example.edu", role: "super_admin", isAdmin: true };

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.mocked(usePathname).mockReturnValue("/admin/dashboard");
  jest.mocked(useAuth).mockReturnValue({
    user: admin,
    loading: false,
    logout: mockLogout,
    updateUserLocal: mockUpdateUser,
  } as ReturnType<typeof useAuth>);
});

async function renderLayout() {
  render(<AdminLayout><h1>Admin content</h1></AdminLayout>);
  return screen.findByRole("button", { name: `Account menu for ${admin.name}` });
}

async function openByClick(trigger: HTMLElement) {
  fireEvent.click(trigger);
  return screen.findByRole("menu");
}

it("opens the real shared menu with actual identity, accessible state, and the existing actions", async () => {
  const trigger = await renderLayout();
  expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  const menu = await openByClick(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveAttribute("aria-controls", menu.id);
  expect(within(menu).getByText(admin.name, { exact: true })).toBeInTheDocument();
  expect(within(menu).getByText(admin.email, { exact: true })).toBeInTheDocument();
  expect(within(menu).getByText(admin.role, { exact: true })).toBeInTheDocument();
  expect(within(menu).getByRole("menuitem", { name: "Profile Settings" })).toBeInTheDocument();
  expect(within(menu).getByRole("menuitem", { name: "Account Preferences" })).toBeInTheDocument();
  expect(within(menu).getByRole("menuitem", { name: "Log Out" })).toHaveAttribute("data-variant", "destructive");
  expect(screen.queryByText("Md Shadab Azam Ansari")).not.toBeInTheDocument();
  expect(screen.queryByText("admin@cumail.in")).not.toBeInTheDocument();
  expect(mockLogout).not.toHaveBeenCalled();
});

it("opens on mouse hover without navigation or logout", async () => {
  const trigger = await renderLayout();
  fireEvent.mouseEnter(trigger, { clientX: 10, clientY: 10 });
  fireEvent.mouseMove(trigger, { clientX: 12, clientY: 12 });
  expect(await screen.findByRole("menu")).toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockLogout).not.toHaveBeenCalled();
});

it("routes both selections to the existing profile form, closing each time", async () => {
  const trigger = await renderLayout();
  let menu = await openByClick(trigger);
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Profile Settings" }));
  expect(mockPush).toHaveBeenLastCalledWith("/profile");
  expect(mockPush).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  expect(trigger).toHaveAttribute("aria-expanded", "false");

  menu = await openByClick(trigger);
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Account Preferences" }));
  expect(mockPush).toHaveBeenLastCalledWith("/profile");
  expect(mockPush).toHaveBeenCalledTimes(2);
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(mockLogout).not.toHaveBeenCalled();
});

it("retains the destructive logout action and admin login destination", async () => {
  const trigger = await renderLayout();
  const menu = await openByClick(trigger);
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Log Out" }));
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith("/admin/login");
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});

it("supports ArrowDown, arrow-key item navigation, Escape, and focus restoration repeatedly", async () => {
  const trigger = await renderLayout();
  for (let attempt = 0; attempt < 2; attempt++) {
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });
    const menu = await screen.findByRole("menu");
    const first = within(menu).getByRole("menuitem", { name: "Profile Settings" });
    await waitFor(() => expect(first).toHaveFocus());
    fireEvent.keyDown(first, { key: "ArrowDown", code: "ArrowDown" });
    const preferences = within(menu).getByRole("menuitem", { name: "Account Preferences" });
    await waitFor(() => expect(preferences).toHaveFocus());
    fireEvent.keyDown(preferences, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  }
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockLogout).not.toHaveBeenCalled();
});

it("supports the native button Enter activation sequence", async () => {
  const trigger = await renderLayout();
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
  // JSDOM does not synthesize the click produced by Enter on a native button.
  fireEvent.click(trigger, { detail: 0 });
  fireEvent.keyUp(trigger, { key: "Enter", code: "Enter" });
  const menu = await screen.findByRole("menu");
  expect(trigger.tagName).toBe("BUTTON");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(menu, { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});

it("uses neutral identity fallbacks rather than another person's details", async () => {
  jest.mocked(useAuth).mockReturnValue({ user: { ...admin, name: "", email: "" }, loading: false, logout: mockLogout, updateUserLocal: mockUpdateUser } as ReturnType<typeof useAuth>);
  render(<AdminLayout><h1>Admin content</h1></AdminLayout>);
  const trigger = await screen.findByRole("button", { name: "Account menu for Administrator" });
  const menu = await openByClick(trigger);
  expect(within(menu).getByText("Administrator", { exact: true })).toBeInTheDocument();
  expect(within(menu).getByText("Email unavailable", { exact: true })).toBeInTheDocument();
  expect(screen.queryByText("Md Shadab Azam Ansari")).not.toBeInTheDocument();
  expect(screen.queryByText("admin@cumail.in")).not.toBeInTheDocument();
});
