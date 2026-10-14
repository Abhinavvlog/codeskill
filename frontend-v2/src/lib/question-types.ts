export const QUESTION_TYPES = [
  { value: "MCQ", label: "MCQ" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "CODE_OUTPUT", label: "Code Output" },
  { value: "DSA", label: "Coding Problem" },
] as const;

export type QuestionType = typeof QUESTION_TYPES[number]["value"];
const aliases: Record<string, QuestionType> = {
  MCQ: "MCQ", single_choice: "MCQ", MULTIPLE_CHOICE: "MULTIPLE_CHOICE", multiple_choice: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE", true_false: "TRUE_FALSE", CODE_OUTPUT: "CODE_OUTPUT", code_output: "CODE_OUTPUT",
  DSA: "DSA", coding: "DSA", algorithmic: "DSA",
};

export function normalizeQuestionType(type?: string, fallback: QuestionType = "MCQ"): QuestionType {
  return (type && aliases[type]) || fallback;
}

export function getQuestionTypeLabel(type?: string): string {
  if (type === "subjective") return "Subjective";
  const normalized = type ? aliases[type] : "MCQ";
  return QUESTION_TYPES.find(item => item.value === normalized)?.label || type || "MCQ";
}

// Topic categories are stored in existing metadata JSON. Older records use topic.
export function getTopicCategories(question: { metadata?: { categories?: string[] }; categories?: string[]; topic?: string }): string[] {
  const categories = question.metadata?.categories ?? question.categories;
  return Array.isArray(categories) ? categories : question.topic ? [question.topic] : [];
}
