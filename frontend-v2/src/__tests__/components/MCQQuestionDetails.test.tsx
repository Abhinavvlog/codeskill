import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MCQQuestionDetails from "@/app/admin/questions/_components/MCQQuestionDetails";

it("renders MCQ title, URL slug, and the actual question statement separately", () => {
  render(<MCQQuestionDetails question={{
    title: "Java Inheritance",
    url_slug: "java-inheritance",
    question: "Which statement correctly describes inheritance in Java?",
    options: [
      { text: "A class acquires members from another class", isCorrect: true },
      { text: "Inheritance prevents code reuse", isCorrect: false },
      { text: "A class can extend multiple classes", isCorrect: false },
      { text: "Inheritance is only for interfaces", isCorrect: false },
    ],
    correctAnswer: 0,
  }} />);

  expect(screen.getByText("Java Inheritance")).toBeInTheDocument();
  expect(screen.getByText("java-inheritance")).toBeInTheDocument();
  expect(screen.getByText("Which statement correctly describes inheritance in Java?")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.getByText("A class acquires members from another class")).toBeInTheDocument();
  expect(screen.getByText("Correct answer")).toBeInTheDocument();
});

it("renders legacy records and tolerates missing optional MCQ fields", () => {
  render(<MCQQuestionDetails question={{ question: "Legacy question statement", slug: null }} />);

  expect(screen.getAllByText("Legacy question statement")).toHaveLength(2);
  expect(screen.getByText("Not set")).toBeInTheDocument();
});

it("renders the persisted string option array and honors correctAnswers indices", () => {
  render(<MCQQuestionDetails question={{
    question: "Pick the correct answer",
    options: ["Incorrect", "Correct"],
    correctAnswer: 0,
    correctAnswers: [1],
  }} />);

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  const correctOption = screen.getByText("Correct").closest("li");
  expect(correctOption).toHaveTextContent("Correct answer");
  expect(screen.getByText("Incorrect").closest("li")).not.toHaveTextContent("Correct answer");
});
