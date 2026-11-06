import type { AdminApi } from "./contract";
import { ApiError, type ApiErrorCode } from "./errors";

/*
 * The admin client for the real backend: same calls as the mock, sent to the
 * endpoints in docs/specs/admin-api.md. The session is an httpOnly cookie, so
 * every request goes with `credentials: "include"`.
 */
export function createHttpApi(baseUrl: string): AdminApi {
  const root = `${baseUrl.replace(/\/$/, "")}/admin`;

  async function request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | undefined>): Promise<T> {
    const qs = query ? new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => !!e[1])).toString() : "";
    let response: Response;
    try {
      response = await fetch(`${root}${path}${qs ? `?${qs}` : ""}`, {
        method,
        credentials: "include",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError("network", "Network error");
    }
    if (response.status === 204 || response.status === 202) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data?.error ?? {};
      throw new ApiError((error.code as ApiErrorCode) ?? "server", error.message ?? response.statusText, error.fields, response.status);
    }
    return data as T;
  }

  const get = <T>(path: string, query?: Record<string, string | undefined>) => request<T>("GET", path, undefined, query);
  const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
  const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
  const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
  const del = <T>(path: string) => request<T>("DELETE", path);
  const id = encodeURIComponent;

  return {
    auth: {
      requestLink: (email, locale) => post("/auth/email-link", { email, locale }),
      verifyCode: (email, code) => post("/auth/verify-code", { email, code }),
      verifyToken: (token) => post("/auth/verify-token", { token }),
      session: async () => {
        try {
          return await get("/session");
        } catch (error) {
          if (error instanceof ApiError && error.code === "unauthenticated") return null;
          throw error;
        }
      },
      signOut: () => post("/auth/sign-out"),
      requestAccess: (input) => post("/access-requests", input),
    },
    sheikhs: {
      directory: () => get("/directory/sheikhs"),
      get: (sheikhId) => get(`/sheikhs/${id(sheikhId)}`),
      update: (sheikhId, input) => put(`/sheikhs/${id(sheikhId)}`, input),
    },
    dashboard: {
      summary: (sheikhId) => get(`/sheikhs/${id(sheikhId)}/dashboard`),
    },
    videos: {
      list: (filter) => get("/videos", { ...filter }),
      get: (videoId) => get(`/videos/${id(videoId)}`),
      create: (input) => post("/videos", input),
      update: (videoId, input) => put(`/videos/${id(videoId)}`, input),
      setStatus: (videoId, status) => patch(`/videos/${id(videoId)}/status`, { status }),
      remove: (videoId) => del(`/videos/${id(videoId)}`),
      topics: (sheikhId) => get(`/sheikhs/${id(sheikhId)}/topics`),
    },
    series: {
      list: (sheikhId) => get("/series", { sheikhId }),
      get: (seriesId) => get(`/series/${id(seriesId)}`),
      create: (input) => post("/series", input),
      update: (seriesId, input) => put(`/series/${id(seriesId)}`, input),
      reorder: (seriesId, episodeIds) => put(`/series/${id(seriesId)}/episodes`, { episodeIds }),
      remove: (seriesId) => del(`/series/${id(seriesId)}`),
    },
    playlists: {
      list: (sheikhId) => get("/playlists", { sheikhId }),
      get: (playlistId) => get(`/playlists/${id(playlistId)}`),
      create: (input) => post("/playlists", input),
      update: (playlistId, input) => put(`/playlists/${id(playlistId)}`, input),
      remove: (playlistId) => del(`/playlists/${id(playlistId)}`),
    },
    shorts: {
      list: (sheikhId) => get("/shorts", { sheikhId }),
      update: (shortId, body) => patch(`/shorts/${id(shortId)}`, body),
      importJobs: (sheikhId) => get("/shorts/imports", { sheikhId }),
      startImport: (sheikhId, input) => post("/shorts/imports", { sheikhId, input }),
      retryImportItem: (jobId, itemId) => post(`/shorts/imports/${id(jobId)}/items/${id(itemId)}/retry`),
    },
    questions: {
      list: (sheikhId, filter) => get("/questions", { sheikhId, ...filter }),
      counts: (sheikhId) => get("/questions/counts", { sheikhId }),
      update: (questionId, body) => patch(`/questions/${id(questionId)}`, body),
      answer: (questionId, input) => put(`/questions/${id(questionId)}/answer`, input),
      reject: (questionId, reason) => post(`/questions/${id(questionId)}/reject`, { reason }),
      restore: (questionId) => post(`/questions/${id(questionId)}/restore`),
      categories: (sheikhId) => get("/question-categories", { sheikhId }),
      saveCategory: (category) => (category.id ? put(`/question-categories/${id(category.id)}`, category) : post("/question-categories", category)),
      removeCategory: (categoryId) => del(`/question-categories/${id(categoryId)}`),
    },
    team: {
      list: (sheikhId) => get(`/sheikhs/${id(sheikhId)}/members`),
      invite: (input) => post("/invitations", input),
      approve: (memberId, sheikhId, role) => post(`/members/${id(memberId)}/approve`, { sheikhId, role }),
      decline: (memberId, sheikhId) => post(`/members/${id(memberId)}/decline`, { sheikhId }),
      updateRole: (memberId, role) => patch(`/members/${id(memberId)}`, { role }),
      revoke: (memberId, sheikhId) => del(`/members/${id(memberId)}/sheikhs/${id(sheikhId)}`),
      resendInvite: (memberId) => post(`/invitations/${id(memberId)}/resend`),
    },
    uploads: {
      async create(file, purpose, onProgress) {
        // 1. Ask for a signed upload URL; 2. PUT the file there (XHR for progress).
        const target = await post<{ uploadUrl: string; headers?: Record<string, string>; fileUrl: string }>("/uploads", {
          purpose,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", target.uploadUrl);
          Object.entries(target.headers ?? { "Content-Type": file.type }).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new ApiError("server", "Upload failed", undefined, xhr.status)));
          xhr.onerror = () => reject(new ApiError("network", "Upload failed"));
          xhr.send(file);
        });
        return { url: target.fileUrl, contentType: file.type, sizeBytes: file.size };
      },
    },
  };
}
