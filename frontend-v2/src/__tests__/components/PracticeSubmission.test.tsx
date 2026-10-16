import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Page from "@/app/problems/[id]/page";
import { problemsAPI, runAPI, submissionAPI } from "@/config/api";
import { useExecutionRuntimes } from "@/hooks/useExecutionRuntimes";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  use: () => ({ id: "feedback" }),
}));
jest.mock("@/hooks/useExecutionRuntimes", () => ({
  useExecutionRuntimes: jest.fn(() => []),
}));
jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));
jest.mock("@/components/pet/PracticePet", () => () => null);
jest.mock("@gsap/react", () => ({ useGSAP: () => {} }));
jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <textarea
      aria-label="Practice code editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
jest.mock("react-resizable-panels", () => ({
  Panel: ({ children }: any) => <div>{children}</div>,
  Group: ({ children }: any) => <div>{children}</div>,
  Separator: () => <div />,
}));
jest.mock("@/config/api", () => ({
  problemsAPI: { getBySlug: jest.fn() },
  runAPI: { run: jest.fn(), getJob: jest.fn() },
  submissionAPI: { submitAndWait: jest.fn(), getSubmissions: jest.fn() },
  discussionsAPI: {},
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useExecutionRuntimes).mockReturnValue([]);
  localStorage.clear();
  localStorage.setItem("codeskill_token", "local-test-token");
  jest.mocked(problemsAPI.getBySlug).mockResolvedValue({
    data: {
      data: {
        _id: "problem-1",
        title: "Feedback problem",
        slug: "feedback",
        difficulty: "Easy",
        categories: [],
        statement: {
          description: "Read input and echo it.",
          samples: [{ input: "PUBLIC", output: "PUBLIC" }],
        },
        testCases: { cases: [{ input: "PUBLIC", output: "PUBLIC" }] },
        config: {
          supportedLanguages: ["javascript"],
          starterCode: { javascript: "console.log(0)" },
        },
      },
    },
  } as any);
});

it("selects Python automatically for a Python-only problem and submits its restored Python draft", async () => {
  const response = await jest.mocked(problemsAPI.getBySlug)("feedback");
  response.data.data.config = {
    supportedLanguages: ["python"],
    starterCode: { python: "print(input())" },
  };
  jest.mocked(problemsAPI.getBySlug).mockResolvedValue(response);
  localStorage.setItem(
    "codeskill_draft_feedback_python",
    'print("saved Python draft")',
  );
  jest
    .mocked(submissionAPI.submitAndWait)
    .mockResolvedValue({
      status: "accepted",
      passedCount: 1,
      totalCount: 1,
      results: [],
    });
  render(<Page params={Promise.resolve({ id: "feedback" })} />);
  const selector = await screen.findByRole("button", {
    name: "Select programming language",
  });
  expect(selector).toHaveTextContent("Python 3");
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Practice code editor" }),
    ).toHaveValue('print("saved Python draft")'),
  );
  fireEvent.click(selector);
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByRole("option", { name: "Python 3" })).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "JavaScript" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));
  await waitFor(() =>
    expect(submissionAPI.submitAndWait).toHaveBeenCalledWith(
      {
        problemId: "problem-1",
        code: 'print("saved Python draft")',
        language: "python",
      },
      expect.any(Function),
    ),
  );
  expect(await screen.findByTestId("practice-confetti")).toBeInTheDocument();
});

it("disables execution when no enabled runtime supports the problem", async () => {
  const response = await jest.mocked(problemsAPI.getBySlug)("feedback");
  response.data.data.config = {
    supportedLanguages: ["python"],
    starterCode: { python: "print(input())" },
  };
  jest.mocked(problemsAPI.getBySlug).mockResolvedValue(response);
  jest
    .mocked(useExecutionRuntimes)
    .mockReturnValue([{ language: "python", enabled: false }]);
  render(<Page params={Promise.resolve({ id: "feedback" })} />);
  expect(
    await screen.findByRole("button", { name: "Submit", exact: true }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Select programming language" }),
  );
  expect(
    screen.getByText("No runtime is available for this problem."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
});

it("practice Submit waits for the full verdict and reveals only failing hidden-case details", async () => {
  let finish!: (result: any) => void;
  jest.mocked(submissionAPI.submitAndWait).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<Page params={Promise.resolve({ id: "feedback" })} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Submit", exact: true }),
  );
  await screen.findByText("Waiting for a judge");
  expect(screen.queryByText("Accepted")).not.toBeInTheDocument();
  expect(screen.queryByTestId("practice-confetti")).not.toBeInTheDocument();
  expect(runAPI.run).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await act(async () =>
    finish({
      status: "wrong_answer",
      passedCount: 2,
      totalCount: 3,
      runtime: 5,
      memory: 12,
      results: [
        { id: 1, passed: true, output: "DO-NOT-SHOW-PASSED" },
        {
          id: 3,
          isHidden: true,
          passed: false,
          input: "FAILED-HIDDEN-INPUT",
          expected: "EXPECTED",
          output: "ACTUAL",
        },
      ],
    }),
  );
  expect(
    await screen.findByRole("region", { name: "Submission result" }),
  ).toBeInTheDocument();
  expect(screen.getByText("2 / 3")).toBeInTheDocument();
  expect(screen.getByText("FAILED-HIDDEN-INPUT")).toBeInTheDocument();
  expect(screen.getByText("ACTUAL")).toBeInTheDocument();
  expect(screen.queryByTestId("practice-confetti")).not.toBeInTheDocument();
  expect(screen.queryByText("DO-NOT-SHOW-PASSED")).not.toBeInTheDocument();
  expect(submissionAPI.submitAndWait).toHaveBeenCalledWith(
    expect.objectContaining({ problemId: "problem-1" }),
    expect.any(Function),
  );
});

it("practice Run checks samples and displays a run result without creating a submission", async () => {
  jest.mocked(runAPI.run).mockResolvedValue({
    data: {
      success: true,
      status: "accepted",
      passedCount: 1,
      totalCount: 1,
      runtime: 4,
      results: [{ id: 1, passed: true, output: "PUBLIC", expected: "PUBLIC" }],
    },
  } as any);
  render(<Page params={Promise.resolve({ id: "feedback" })} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Run", exact: true }),
  );
  await screen.findByText("Run successful");
  expect(screen.queryByTestId("practice-confetti")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(runAPI.run).toHaveBeenCalledWith(
      expect.objectContaining({
        testCases: [{ id: 1, input: "PUBLIC", expected: "PUBLIC" }],
      }),
    ),
  );
  expect(submissionAPI.submitAndWait).not.toHaveBeenCalled();
});
