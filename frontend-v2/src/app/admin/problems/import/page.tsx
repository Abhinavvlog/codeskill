"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, ArrowRight } from "lucide-react";
import { adminQuestionsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import { getTopicCategories } from "@/lib/question-types";
import type { CodingBankRecord } from "@/lib/practice-problems";

export default function ImportPracticeProblemPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    questions: CodingBankRecord[];
    pages: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      adminQuestionsAPI
        .getAll(
          {
            page,
            limit: 20,
            search: search.trim(),
            questionType: "DSA",
            status: "all",
          },
          controller.signal,
        )
        .then((response) => {
          if (controller.signal.aborted) return;
          const body = response.data;
          if (!Array.isArray(body.questions))
            throw new Error("Invalid question list.");
          const questions = body.questions.filter(
            (question: CodingBankRecord) =>
              (question.id || question._id || question.mongoId) &&
              ["dsa", "coding", "algorithmic"].includes(
                String(question.questionType).toLowerCase(),
              ) &&
              question.status !== "archived",
          );
          setResult({ questions, pages: body.pagination?.totalPages ?? 1 });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError("Question Bank could not be loaded. Please try again.");
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page, retry]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <Link
        href="/admin/problems"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Problems
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Import from Question Bank
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a coding question to create an independent practice copy.
          Review its statement, languages, and test cases before publishing.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 p-4">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              aria-label="Search Question Bank"
              placeholder="Search by title, topic, or tag…"
              value={search}
              onChange={(event) => {
                setResult(null);
                setError("");
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        {error ? (
          <div role="alert" className="space-y-3 p-8 text-center text-sm">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError("");
                setRetry((value) => value + 1);
              }}
              className="font-semibold text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : !result ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground"
          >
            <Spinner className="h-5 w-5" /> Loading coding questions…
          </div>
        ) : !result.questions.length ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">No coding questions found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or add a coding question to the Question Bank.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {result.questions.map((question) => {
              const id = question.id || question._id || question.mongoId!;
              const title =
                question.title ||
                question.question ||
                "Untitled coding question";
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        question.difficulty,
                        ...getTopicCategories(question),
                        question.status,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/problems/create?fromQuestion=${encodeURIComponent(id)}`}
                    aria-label={`Import ${title}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                  >
                    Import & edit <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {result && result.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setResult(null);
                setError("");
                setPage((value) => value - 1);
              }}
              className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {result.pages}
            </span>
            <button
              type="button"
              disabled={page >= result.pages}
              onClick={() => {
                setResult(null);
                setError("");
                setPage((value) => value + 1);
              }}
              className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
