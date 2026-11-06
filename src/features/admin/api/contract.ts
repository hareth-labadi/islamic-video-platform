import type {
  AccessRequestInput,
  AdminPlaylist,
  AdminQuestion,
  AdminSeries,
  AdminSheikh,
  AdminShort,
  AdminVideo,
  AnswerInput,
  DashboardSummary,
  ImportInput,
  ImportJob,
  InviteInput,
  InviteResult,
  Locale,
  Member,
  PlaylistInput,
  PublishStatus,
  QuestionCategory,
  QuestionFilter,
  QuestionStatus,
  RejectReason,
  Role,
  SeriesInput,
  Session,
  SheikhInput,
  ShortPatch,
  UploadPurpose,
  UploadResult,
  VideoFilter,
  VideoInput,
} from "./types";

export type CategoryWithCount = QuestionCategory & { questionCount: number };

export interface QuestionPatch {
  /** Edited text, to remove a personal detail the visitor typed (20–1500 chars). */
  body?: string;
  categoryId?: string;
  /** null clears the suggestion. */
  suggestedVideoId?: string | null;
  published?: boolean;
}

/**
 * Every call the admin panel makes. Two implementations: the in-memory mock
 * (default) and the HTTP client for the real backend (docs/specs/admin-api.md).
 */
export interface AdminApi {
  auth: {
    /** Sends a one-time link + 6-digit code. Always succeeds (no account enumeration). */
    requestLink(email: string, locale: Locale): Promise<void>;
    verifyCode(email: string, code: string): Promise<Session>;
    /** Signs in from the link in the e-mail. */
    verifyToken(token: string): Promise<Session>;
    session(): Promise<Session | null>;
    signOut(): Promise<void>;
    requestAccess(input: AccessRequestInput): Promise<void>;
  };
  sheikhs: {
    /** Public list (for the access-request form). */
    directory(): Promise<Array<Pick<AdminSheikh, "id" | "name" | "monogram" | "photo">>>;
    get(id: string): Promise<AdminSheikh>;
    update(id: string, input: SheikhInput): Promise<AdminSheikh>;
  };
  dashboard: {
    summary(sheikhId: string): Promise<DashboardSummary>;
  };
  videos: {
    list(filter: VideoFilter): Promise<AdminVideo[]>;
    get(id: string): Promise<AdminVideo>;
    create(input: VideoInput): Promise<AdminVideo>;
    update(id: string, input: VideoInput): Promise<AdminVideo>;
    setStatus(id: string, status: PublishStatus): Promise<AdminVideo>;
    remove(id: string): Promise<void>;
    /** Topics already used by this sheikh, for suggestions. */
    topics(sheikhId: string): Promise<string[]>;
  };
  series: {
    list(sheikhId: string): Promise<AdminSeries[]>;
    get(id: string): Promise<AdminSeries>;
    create(input: SeriesInput): Promise<AdminSeries>;
    update(id: string, input: SeriesInput): Promise<AdminSeries>;
    /** Sets the episode order; episode numbers follow the order. */
    reorder(id: string, episodeIds: string[]): Promise<AdminSeries>;
    remove(id: string): Promise<void>;
  };
  playlists: {
    list(sheikhId: string): Promise<AdminPlaylist[]>;
    get(id: string): Promise<AdminPlaylist>;
    create(input: PlaylistInput): Promise<AdminPlaylist>;
    update(id: string, input: PlaylistInput): Promise<AdminPlaylist>;
    remove(id: string): Promise<void>;
  };
  shorts: {
    list(sheikhId: string): Promise<AdminShort[]>;
    update(id: string, patch: ShortPatch): Promise<AdminShort>;
    importJobs(sheikhId: string): Promise<ImportJob[]>;
    startImport(sheikhId: string, input: ImportInput): Promise<ImportJob>;
    retryImportItem(jobId: string, itemId: string): Promise<ImportJob>;
  };
  questions: {
    list(sheikhId: string, filter: QuestionFilter): Promise<AdminQuestion[]>;
    counts(sheikhId: string): Promise<Record<QuestionStatus, number>>;
    update(id: string, patch: QuestionPatch): Promise<AdminQuestion>;
    answer(id: string, input: AnswerInput): Promise<AdminQuestion>;
    reject(id: string, reason: RejectReason): Promise<AdminQuestion>;
    restore(id: string): Promise<AdminQuestion>;
    categories(sheikhId: string): Promise<CategoryWithCount[]>;
    saveCategory(category: Omit<QuestionCategory, "id"> & { id?: string }): Promise<QuestionCategory>;
    removeCategory(id: string): Promise<void>;
  };
  team: {
    list(sheikhId: string): Promise<Member[]>;
    invite(input: InviteInput): Promise<InviteResult>;
    approve(memberId: string, sheikhId: string, role: Exclude<Role, "owner">): Promise<Member>;
    decline(memberId: string, sheikhId: string): Promise<void>;
    updateRole(memberId: string, role: Exclude<Role, "owner">): Promise<Member>;
    /** Removes this sheikh from the member's access (or cancels an invitation). */
    revoke(memberId: string, sheikhId: string): Promise<void>;
    resendInvite(memberId: string): Promise<InviteResult>;
  };
  uploads: {
    create(file: File, purpose: UploadPurpose, onProgress?: (pct: number) => void): Promise<UploadResult>;
  };
}
