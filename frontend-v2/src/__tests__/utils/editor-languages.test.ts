import {
  canonicalEditorLanguage,
  editorLanguages,
} from "@/lib/editor-languages";
const options = [{ id: "javascript" }, { id: "python" }, { id: "cpp" }];
it("intersects problem permissions and enabled runtimes, including aliases", () => {
  expect(
    editorLanguages(
      options,
      ["python3", "c++"],
      [
        { language: "py", enabled: true },
        { language: "cpp", enabled: false },
        { language: "node", enabled: true },
      ],
    ),
  ).toEqual([{ id: "python" }]);
});
it("keeps unrestricted configurations working and returns no options for unsupported languages", () => {
  expect(editorLanguages(options, [])).toEqual(options);
  expect(editorLanguages(options, ["ruby"])).toEqual([]);
  expect(canonicalEditorLanguage("  JS ")).toBe("javascript");
});
