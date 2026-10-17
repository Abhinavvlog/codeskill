type MCQQuestionDetailsProps = {
  question: {
    title?: string | null;
    question?: string | null;
    slug?: string | null;
    url_slug?: string | null;
    options?: unknown;
    correctAnswer?: number | null;
    correctAnswers?: number[] | null;
    codeSnippet?: string | null;
    language?: string | null;
    explanation?: string | null;
    tags?: string[] | null;
  };
};

export default function MCQQuestionDetails({ question }: MCQQuestionDetailsProps) {
  const title = question.title?.trim() || question.question?.trim() || "Untitled MCQ";
  const statement = question.question?.trim() || question.title?.trim() || "Question statement unavailable";
  const slug = question.url_slug?.trim() || question.slug?.trim();
  let rawOptions = question.options;
  if (typeof rawOptions === "string") {
    try {
      rawOptions = JSON.parse(rawOptions);
    } catch {
      rawOptions = [];
    }
  }
  const options = Array.isArray(rawOptions) ? rawOptions : [];
  const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];

  return (
    <div className="space-y-4" data-testid="mcq-question-details">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-slate-500">Title</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">{title}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">URL slug</dt>
          <dd className="mt-0.5 font-mono text-slate-700">{slug || "Not set"}</dd>
        </div>
      </dl>
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Question</h4>
        <div className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
          {statement}
        </div>
      </div>
      <section aria-label="Answer options" className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Answer options</h4>
        {options.some((option) => (typeof option === "string" ? option : (option as { text?: string } | null)?.text || "").trim()) ? (
          <ol className="grid gap-2">
            {options.map((option, index) => {
              const text = (typeof option === "string" ? option : (option as { text?: string } | null)?.text || "").trim();
              if (!text) return null;
              const objectOption = typeof option === "object" && option !== null ? option as { isCorrect?: boolean; explanation?: string } : null;
              const isCorrect = objectOption?.isCorrect !== undefined
                ? Boolean(objectOption.isCorrect)
                : correctAnswers.length > 0
                  ? correctAnswers.includes(index)
                  : question.correctAnswer === index;
              return (
                <li key={index} className={`rounded-lg border p-3 ${isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-slate-500">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1 text-sm text-slate-800">{text}</span>
                    {isCorrect && <span className="text-xs font-semibold text-emerald-700">Correct answer</span>}
                  </div>
                  {objectOption?.explanation && <p className="ml-7 mt-2 text-xs text-slate-500">{objectOption.explanation}</p>}
                </li>
              );
            })}
          </ol>
        ) : <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">No answer options are available.</p>}
      </section>
      {question.codeSnippet && <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{question.language || "Code"}</h4>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-50"><code>{question.codeSnippet}</code></pre>
      </section>}
      {question.explanation && <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Explanation</h4>
        <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{question.explanation}</p>
      </section>}
      {question.tags?.length ? <div className="flex flex-wrap gap-2" aria-label="Question tags">
        {question.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>)}
      </div> : null}
    </div>
  );
}
