import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import Page from "@/app/assessments/page";
import { useAuth } from "@/context/AuthContext";
import { studentAssessmentsAPI } from "@/config/api";
import { formatSemesterScope } from "@/lib/assessment-cards";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/config/api", () => ({
  studentAssessmentsAPI: { getMyAssessments: jest.fn(), retakeAttempt: jest.fn() },
}));

const load = jest.mocked(studentAssessmentsAPI.getMyAssessments);
const auth = jest.mocked(useAuth);

describe("Assessment Semester Targeting UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockReturnValue({
      user: {
        id: "student-1",
        name: "Test Student",
        studentProfile: { semester: 4, section: "CSE-A", group: "A" },
      },
      loading: false,
    } as ReturnType<typeof useAuth>);
  });

  describe("formatSemesterScope utility", () => {
    it("formats empty or missing semesters as 'All Semesters'", () => {
      expect(formatSemesterScope([])).toBe("All Semesters");
      expect(formatSemesterScope(undefined)).toBe("All Semesters");
    });

    it("formats a single semester properly", () => {
      expect(formatSemesterScope(["4"])).toBe("Semester 4");
      expect(formatSemesterScope(["Semester 6"])).toBe("Semester 6");
      expect(formatSemesterScope(["sem 2"])).toBe("Semester 2");
    });

    it("formats multiple semesters in ascending order", () => {
      expect(formatSemesterScope(["5", "3", "4"])).toBe("Semesters: 3, 4, 5");
    });
  });

  describe("Student Assessment Cards Semester Badges", () => {
    it("renders semester, section, and cohort metadata badges on assessment cards", async () => {
      load.mockResolvedValue({
        data: {
          assessments: [
            {
              _id: "a-sem4",
              title: "Algorithms & Analysis",
              durationMinutes: 60,
              questionCount: 10,
              totalMarks: 50,
              status: "published",
              attemptStatus: "not_started",
              targetSemesters: ["4"],
              targetSections: ["CSE-A"],
              targetGroups: ["A"],
              allowedAttempts: 1,
              completedAttemptsCount: 0,
            },
            {
              _id: "a-open",
              title: "General Coding Contest",
              durationMinutes: 45,
              questionCount: 5,
              totalMarks: 30,
              status: "published",
              attemptStatus: "not_started",
              targetSemesters: [],
              allowedAttempts: 0,
            },
          ],
        },
      } as any);

      render(<Page />);

      await screen.findByRole("heading", { name: "Algorithms & Analysis" });

      const sem4Card = screen.getByRole("heading", { name: "Algorithms & Analysis" }).closest("article")!;
      expect(within(sem4Card).getByText("Semester 4")).toBeInTheDocument();
      expect(within(sem4Card).getByText("Sec: CSE-A")).toBeInTheDocument();
      expect(within(sem4Card).getByText("Grp: A")).toBeInTheDocument();

      const openCard = screen.getByRole("heading", { name: "General Coding Contest" }).closest("article")!;
      expect(within(openCard).getByText("All Semesters")).toBeInTheDocument();
      expect(within(openCard).getByText("Unlimited attempts")).toBeInTheDocument();
    });
  });
});
