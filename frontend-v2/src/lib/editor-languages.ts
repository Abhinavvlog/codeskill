export function canonicalEditorLanguage(value: string): string {
  const language = value.trim().toLowerCase();
  return (
    (
      {
        "c++": "cpp",
        python3: "python",
        py: "python",
        js: "javascript",
        node: "javascript",
        ts: "typescript",
      } as Record<string, string>
    )[language] || language
  );
}

export function editorLanguages<T extends { id: string }>(
  choices: T[],
  supported?: string[],
  runtimes: Array<{ language: string; enabled: boolean }> = [],
): T[] {
  return choices.filter(
    (choice) =>
      (!supported?.length ||
        supported.some(
          (value) => canonicalEditorLanguage(value) === choice.id,
        )) &&
      (!runtimes.length ||
        runtimes.some(
          (runtime) =>
            canonicalEditorLanguage(runtime.language) === choice.id &&
            runtime.enabled,
        )),
  );
}
