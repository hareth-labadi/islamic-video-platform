import type { AdminApi } from "../contract";
import { wait } from "./store";

const BIG_FILE = 50_000_000;

export const uploads: AdminApi["uploads"] = {
  async create(file, _purpose, onProgress) {
    const steps = file.size > BIG_FILE ? 14 : 6;
    for (let i = 1; i <= steps; i++) {
      await wait(file.size > BIG_FILE ? 220 : 120);
      onProgress?.(Math.round((i / steps) * 100));
    }
    // Demo: the "uploaded" file lives in this tab only.
    return { url: URL.createObjectURL(file), contentType: file.type, sizeBytes: file.size };
  },
};
