import React from "react";
import { render } from "@testing-library/react";

jest.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children, style }: any) => <div data-testid="pdf-page" style={style}>{children}</div>,
  View: ({ children, style }: any) => <div data-testid="pdf-view" style={style}>{children}</div>,
  Text: ({ children, style }: any) => <span data-testid="pdf-text" style={style}>{children}</span>,
  Image: (props: any) => <img data-testid="pdf-image" alt="pdf" {...props} />,
  Svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  Circle: (props: any) => <circle {...props} />,
  G: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  Path: (props: any) => <path {...props} />,
  Rect: (props: any) => <rect {...props} />,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  PDFViewer: ({ children }: any) => <div>{children}</div>,
  PDFDownloadLink: ({ children }: any) =>
    typeof children === "function" ? children({ loading: false, error: null }) : children,
}));

import { ScoreDonutChart } from "@/components/pdf/ScoreDonutChart";
import { AssessmentPerformanceReport } from "@/components/pdf/AssessmentPerformanceReport";
import { AssessmentReportPDF } from "@/components/reports/pdf/AssessmentReportPDF";

describe("PDF Report & ScoreDonutChart Layout Tests", () => {
  it("renders ScoreDonutChart without crashing and displays Total Evaluation and score separately", () => {
    const { container } = render(
      <ScoreDonutChart
        score={85}
        maxScore={100}
        easyScore={15}
        easyMax={15}
        medScore={25}
        medMax={25}
        hardScore={45}
        hardMax={60}
      />
    );

    expect(container.textContent).toContain("Total Evaluation");
    expect(container.textContent).toContain("85 / 100 Pts (85%)");
  });

  it("handles various score lengths responsively (0 score, 100%, large scores)", () => {
    const testCases = [
      { score: 0, maxScore: 100, expectedText: "0 / 100 Pts (0%)" },
      { score: 100, maxScore: 100, expectedText: "100 / 100 Pts (100%)" },
      { score: 85, maxScore: 100, expectedText: "85 / 100 Pts (85%)" },
      { score: 950, maxScore: 1000, expectedText: "950 / 1000 Pts (95%)" },
    ];

    testCases.forEach(({ score, maxScore, expectedText }) => {
      const { container } = render(
        <ScoreDonutChart
          score={score}
          maxScore={maxScore}
          easyScore={10}
          easyMax={20}
          medScore={20}
          medMax={30}
          hardScore={30}
          hardMax={50}
        />
      );

      expect(container.textContent).toContain("Total Evaluation");
      expect(container.textContent).toContain(expectedText);
    });
  });

  it("renders AssessmentPerformanceReport without crashing and maintains layout hierarchy", () => {
    const reportData = {
      reportId: "CU-CS-2026-0001",
      assessmentName: "DSA Assessment - Round 1",
      student: {
        name: "Test Candidate",
        email: "candidate@cumail.in",
        institution: "Chandigarh University",
        program: "B.Tech CSE",
      },
      performance: {
        totalProblems: 5,
        totalSolved: 4,
        score: 85,
        maxScore: 100,
        acceptanceRate: 80,
      },
      questions: [
        { id: "1", title: "Two Sum", difficulty: "Easy", status: "Passed", points: 20 },
        { id: "2", title: "Reverse Linked List", difficulty: "Medium", status: "Passed", points: 30 },
        { id: "3", title: "Merge Intervals", difficulty: "Hard", status: "Passed", points: 35 },
      ],
    };

    const { container } = render(<AssessmentPerformanceReport data={reportData} />);
    expect(container.textContent).toContain("Total Evaluation");
    expect(container.textContent).toContain("85 / 100 Pts (85%)");
  });

  it("renders AssessmentReportPDF adaptor component properly", () => {
    const data = {
      reportId: "CU-CS-2026-0042",
      generatedAt: "12 Oct 2026",
      assessmentName: "Technical Round",
      student: {
        name: "Aman Sharma",
        email: "aman@cuchd.in",
      },
      performance: {
        score: 85,
        totalSolved: 3,
        acceptanceRate: 75,
        streak: 10,
      },
      submissions: [
        { _id: "s1", problemTitle: "Problem 1", status: "Accepted" },
        { _id: "s2", problemTitle: "Problem 2", status: "Accepted" },
      ],
    };

    const { container } = render(<AssessmentReportPDF data={data} />);
    expect(container.textContent).toContain("Total Evaluation");
    expect(container.textContent).toContain("85 / 100 Pts (85%)");
  });
});
