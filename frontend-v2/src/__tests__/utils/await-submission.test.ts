import { awaitSubmission } from "@/lib/submission-feedback";

it("submits once and waits through queued/running/testing for the persisted full verdict", async () => {
  const start = jest
    .fn()
    .mockResolvedValue({
      data: { submissionId: "full-judge", status: "queued" },
    });
  const poll = jest
    .fn()
    .mockResolvedValueOnce({ data: { status: "running" } })
    .mockResolvedValueOnce({ data: { status: "testing" } })
    .mockResolvedValueOnce({
      data: {
        status: "wrong_answer",
        testCasesPassed: 3,
        totalTestCases: 5,
        runtime: 4,
        memory: 8,
        testResults: [
          {
            testId: "4",
            isHidden: true,
            passed: false,
            input: "hidden",
            output: "wrong",
            expected: "right",
          },
        ],
      },
    });
  const update = jest.fn();
  const result = await awaitSubmission(start, poll, update, { intervalMs: 1 });
  expect(start).toHaveBeenCalledTimes(1);
  expect(poll).toHaveBeenCalledTimes(3);
  expect(poll).toHaveBeenCalledWith("full-judge");
  expect(update).toHaveBeenCalledWith("testing");
  expect(result).toMatchObject({
    status: "wrong_answer",
    passedCount: 3,
    totalCount: 5,
    memory: 8,
    results: [expect.objectContaining({ input: "hidden" })],
  });
});
it("preserves errors rather than displaying accepted sample results", async () => {
  await expect(
    awaitSubmission(async () => {
      throw new Error("Queue unavailable");
    }, jest.fn()),
  ).rejects.toThrow("Queue unavailable");
});
it("normalizes compilation and limit verdicts without dropping diagnostics", async () => {
  const result = await awaitSubmission(
    async () => ({ data: { submissionId: "id" } }),
    async () => ({
      data: {
        status: "compilation_error",
        testResults: [],
        compileOutput: "Syntax error",
      },
    }),
    undefined,
    { intervalMs: 1 },
  );
  expect(result).toMatchObject({
    status: "compile_error",
    compileOutput: "Syntax error",
  });
});
it("reports a slow submission as still processing, not failed grading", async () => {
  await expect(
    awaitSubmission(
      async () => ({ data: { submissionId: "id" } }),
      jest.fn(),
      undefined,
      { timeoutMs: 0 },
    ),
  ).rejects.toThrow("Check Submissions");
});
