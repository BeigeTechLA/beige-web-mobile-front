import {
  getCompensationTotal,
  getEditor,
  type EditorAssignment,
} from "./postProductionDemoStore";
import type { PostProductionEditor } from "./postProductionEditorUtils";

export type CombinedEditor = PostProductionEditor & {
  source: "api" | "preview";
  demoAssignment?: EditorAssignment;
};

export const combinePostProductionEditors = (
  apiMembers: PostProductionEditor[],
  demoAssignments: EditorAssignment[],
): CombinedEditor[] => {
  const result: CombinedEditor[] = apiMembers.map((editor) => ({
    ...editor,
    source: "api",
  }));
  const ids = new Set(result.map((item) => item.id));
  for (const assignment of demoAssignments) {
    const editor = getEditor(assignment.editorId);
    if (!editor || ids.has(editor.id)) continue;
    ids.add(editor.id);
    result.push({
      id: editor.id,
      name: editor.name,
      role: "Editor",
      category: editor.category,
      specialty: editor.specialty,
      avatarUrl: editor.avatarUrl,
      activeShoots: editor.activeShoots,
      availability:
        editor.availability === "available" ? "available" : "limited",
      agreementType:
        assignment.agreementMode === "individual"
          ? "Individual"
          : assignment.agreementMode === "common"
            ? "Common"
            : undefined,
      agreementVersion: assignment.agreementVersion || undefined,
      compensation: assignment.compensation
        ? getCompensationTotal(assignment.compensation)
        : undefined,
      assignmentStatus: assignment.status,
      source: "preview",
      demoAssignment: assignment,
    });
  }
  return result;
};
