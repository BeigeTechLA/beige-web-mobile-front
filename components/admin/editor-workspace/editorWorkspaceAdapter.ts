"use client";

import {
  addWorkspaceFile,
  EDITING_STAGES,
  getWorkspaceActivity,
  getWorkspaceShoot,
  getWorkspaceShoots,
  setWorkspaceAgreementStatus,
  setWorkspaceEditingStage,
  type EditingStage,
  type EditorWorkspaceRole,
  type WorkspaceActivity,
  type WorkspaceFile,
  type WorkspaceShoot,
} from "./editorWorkspaceDemoStore";

export interface EditorWorkspaceResult {
  success: boolean;
  message?: string;
}
export interface EditorWorkspaceGateway {
  listShoots(
    role: EditorWorkspaceRole,
    scope: "mine" | "all",
  ): Promise<WorkspaceShoot[]>;
  getShoot(
    role: EditorWorkspaceRole,
    shootId: string,
  ): Promise<WorkspaceShoot | null>;
  getActivity(
    role: EditorWorkspaceRole,
    shootId: string,
  ): Promise<WorkspaceActivity[]>;
  changeEditingStatus(
    role: EditorWorkspaceRole,
    shootId: string,
    next: EditingStage,
  ): Promise<EditorWorkspaceResult>;
  decideAgreement(
    shootId: string,
    decision: "accept" | "reject",
    reason?: string,
  ): Promise<EditorWorkspaceResult>;
  uploadDeliverable(
    role: EditorWorkspaceRole,
    shootId: string,
    metadata: WorkspaceFile,
  ): Promise<EditorWorkspaceResult>;
}

const NEXT_STAGE: Partial<Record<EditingStage, EditingStage[]>> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Submitted"],
  "Revision Requested": ["Resubmitted"],
  Approved: ["Completed"],
};

export const editorWorkspaceDemoGateway: EditorWorkspaceGateway = {
  listShoots: async (role, scope) => getWorkspaceShoots(role, scope),
  getShoot: async (role, shootId) => getWorkspaceShoot(shootId, role),
  getActivity: async (role, shootId) => getWorkspaceActivity(shootId, role),
  changeEditingStatus: async (role, shootId, next) => {
    const shoot = getWorkspaceShoot(shootId, role);
    if (!shoot) return { success: false, message: "Shoot not found." };
    const assigned =
      role === "internal" ? shoot.internalAssignment : shoot.externalAssignment;
    if (!assigned)
      return {
        success: false,
        message: "This shoot is not assigned to this Editor.",
      };
    if (role === "external" && shoot.agreementStatus !== "Accepted")
      return {
        success: false,
        message: "Accept the agreement before editing.",
      };
    if (!NEXT_STAGE[shoot.editingStatus]?.includes(next))
      return { success: false, message: "Invalid editing status transition." };
    try {
      setWorkspaceEditingStage(shootId, next, role);
      return { success: true };
    } catch {
      return {
        success: false,
        message: "Could not save the demo editing status.",
      };
    }
  },
  decideAgreement: async (shootId, decision, reason) => {
    const shoot = getWorkspaceShoot(shootId, "external");
    if (!shoot?.externalAssignment)
      return {
        success: false,
        message: "This shoot is not assigned to the external Editor.",
      };
    if (shoot.agreementStatus !== "Pending")
      return {
        success: false,
        message: "This agreement has already been decided.",
      };
    if (decision === "reject" && (reason || "").trim().length < 10)
      return {
        success: false,
        message: "Please provide a rejection reason of at least 10 characters.",
      };
    try {
      setWorkspaceAgreementStatus(
        shootId,
        decision === "accept" ? "Accepted" : "Rejected",
        reason || "",
      );
      return { success: true };
    } catch {
      return {
        success: false,
        message: "Could not save this demo agreement decision.",
      };
    }
  },
  uploadDeliverable: async (role, shootId, metadata) => {
    const shoot = getWorkspaceShoot(shootId, role);
    const assigned =
      role === "internal"
        ? shoot?.internalAssignment
        : shoot?.externalAssignment;
    if (
      !shoot ||
      !assigned ||
      (role === "external" && shoot.agreementStatus !== "Accepted")
    )
      return {
        success: false,
        message: "This editor cannot upload to the shoot.",
      };
    if (!metadata.name || !metadata.folderId)
      return {
        success: false,
        message: "File name and destination are required.",
      };
    try {
      addWorkspaceFile(shootId, metadata, role);
      return { success: true };
    } catch {
      return {
        success: false,
        message: "Could not store file metadata in this browser.",
      };
    }
  },
};
