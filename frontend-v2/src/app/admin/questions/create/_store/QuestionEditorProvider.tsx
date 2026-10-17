"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createQuestionStore, useQuestionStore } from "./useQuestionStore";

const EditorContext = createContext<ReturnType<
  typeof createQuestionStore
> | null>(null);

export function QuestionEditorProvider({
  store,
  children,
}: {
  store: ReturnType<typeof createQuestionStore>;
  children: ReactNode;
}) {
  return (
    <EditorContext.Provider value={store}>{children}</EditorContext.Provider>
  );
}

/** Practice drafts have their own store; bank pages retain their existing store. */
export function useQuestionEditorStore() {
  const useEditorStore = useContext(EditorContext) ?? useQuestionStore;
  return useEditorStore();
}
