import { renderHook, act } from "@testing-library/react";
import { useAssessmentStore } from "@/app/admin/assessments/create/_store/useAssessmentStore";

describe("Assessment Proctoring Policy & Negative Marks Store", () => {
  beforeEach(() => {
    act(() => {
      useAssessmentStore.getState().reset();
    });
  });

  it("defaults to fully_proctored with autoSubmitOnViolation enabled", () => {
    const { result } = renderHook(() => useAssessmentStore());
    expect(result.current.proctoring.mode).toBe("fully_proctored");
    expect(result.current.proctoring.autoSubmitOnViolation).toBe(true);
    expect(result.current.proctoring.useCamera).toBe(true);
    expect(result.current.proctoring.detectTabSwitch).toBe(true);
  });

  it("switches to partial_proctored with manual submission and editable penalty marks", () => {
    const { result } = renderHook(() => useAssessmentStore());

    act(() => {
      result.current.setProctoring({
        mode: "partial_proctored",
        autoSubmitOnViolation: false,
        violationPenaltyMarks: 3.5,
      });
    });

    expect(result.current.proctoring.mode).toBe("partial_proctored");
    expect(result.current.proctoring.autoSubmitOnViolation).toBe(false);
    expect(result.current.proctoring.violationPenaltyMarks).toBe(3.5);
    expect(result.current.proctoring.useCamera).toBe(true);
  });

  it("switches to non_proctored disabling restrictions", () => {
    const { result } = renderHook(() => useAssessmentStore());

    act(() => {
      result.current.setProctoring({
        mode: "non_proctored",
        autoSubmitOnViolation: false,
        useCamera: false,
        enforceFullscreen: false,
        detectTabSwitch: false,
        blockCopyPaste: false,
        violationPenaltyMarks: 0,
      });
    });

    expect(result.current.proctoring.mode).toBe("non_proctored");
    expect(result.current.proctoring.autoSubmitOnViolation).toBe(false);
    expect(result.current.proctoring.useCamera).toBe(false);
    expect(result.current.proctoring.detectTabSwitch).toBe(false);
    expect(result.current.proctoring.violationPenaltyMarks).toBe(0);
  });

  it("correctly hydrates an existing partial_proctored assessment", () => {
    const { result } = renderHook(() => useAssessmentStore());

    act(() => {
      result.current.hydrate({
        title: "Semester Final",
        code: "SEM-2026",
        proctoring: {
          mode: "partial_proctored",
          autoSubmitOnViolation: false,
          violationPenaltyMarks: 4,
          useCamera: true,
        },
      } as any);
    });

    expect(result.current.title).toBe("Semester Final");
    expect(result.current.proctoring.mode).toBe("partial_proctored");
    expect(result.current.proctoring.autoSubmitOnViolation).toBe(false);
    expect(result.current.proctoring.violationPenaltyMarks).toBe(4);
  });
});
