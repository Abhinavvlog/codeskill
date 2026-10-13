import { type QuestionType } from "@/lib/question-types";
export interface AssignedAssessment {
  _id: string; id?: string; title: string; description?: string; code?: string;
  type?: string; questionTypes?: string[]; difficulties?: string[]; difficulty?: string;
  durationMinutes: number; totalMarks: number; questionCount: number;
  startTime?: string; endTime?: string; status: string; attemptStatus?: string;
  attemptScore?: number; attemptPassed?: boolean; canRetake?: boolean; allowedAttempts?: number;
  proctoring?: Record<string, unknown>;
}
const aliases: Record<string, QuestionType> = {
  mcq: "MCQ", single_choice: "MCQ", multiple_choice: "MULTIPLE_CHOICE", true_false: "TRUE_FALSE",
  code_output: "CODE_OUTPUT", dsa: "DSA", coding: "DSA", algorithmic: "DSA",
};
export function assessmentTypes(assessment: AssignedAssessment): QuestionType[] {
  const types = (assessment.questionTypes?.length ? assessment.questionTypes : [assessment.type || ""])
    .map(value => aliases[value.toLowerCase()]).filter((value): value is QuestionType => !!value);
  return [...new Set(types)];
}
export function assessmentCompleted(assessment: AssignedAssessment) {
  return ["submitted", "auto_submitted"].includes(assessment.attemptStatus || "");
}
export function assessmentWindow(assessment: AssignedAssessment, now = Date.now()) {
  if (!["published", "ongoing"].includes(assessment.status)) return assessment.status === "completed" ? "Completed" : "Unavailable";
  const start = assessment.startTime ? new Date(assessment.startTime).getTime() : -Infinity;
  const end = assessment.endTime ? new Date(assessment.endTime).getTime() : Infinity;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "Unavailable";
  return now >= end ? "Completed" : now < start ? "Upcoming" : "Live";
}
export function canAttemptAssessment(assessment: AssignedAssessment, now = Date.now()) {
  return assessmentWindow(assessment, now) === "Live" && (!assessmentCompleted(assessment) || assessment.canRetake === true);
}
