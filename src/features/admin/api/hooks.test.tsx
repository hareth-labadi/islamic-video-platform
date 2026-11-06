import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { invalidate, useAction, useQuery } from "./hooks";

describe("useQuery", () => {
  it("fetches, then exposes the data", async () => {
    const fetcher = vi.fn().mockResolvedValue(["a"]);
    const { result } = renderHook(() => useQuery("list", fetcher));
    expect(result.current).toMatchObject({ pending: true, loading: true, data: undefined });
    await waitFor(() => expect(result.current.data).toEqual(["a"]));
    expect(result.current).toMatchObject({ pending: false, loading: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does nothing while the key is null", () => {
    const fetcher = vi.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useQuery(null, fetcher));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ pending: false, loading: false, data: undefined });
  });

  it("refetches after invalidate(), keeping the old data on screen meanwhile", async () => {
    let n = 0;
    const { result } = renderHook(() => useQuery("count", async () => ++n));
    await waitFor(() => expect(result.current.data).toBe(1));
    act(() => invalidate());
    expect(result.current).toMatchObject({ data: 1, loading: true, pending: false });
    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it("a new key shows nothing until it loads, unless keepPrevious", async () => {
    const fetcher = (key: string) => async () => `data:${key}`;
    const plain = renderHook(({ k }) => useQuery(k, fetcher(k)), { initialProps: { k: "a" } });
    await waitFor(() => expect(plain.result.current.data).toBe("data:a"));
    plain.rerender({ k: "b" });
    expect(plain.result.current).toMatchObject({ data: undefined, pending: true });
    await waitFor(() => expect(plain.result.current.data).toBe("data:b"));

    const kept = renderHook(({ k }) => useQuery(k, fetcher(k), { keepPrevious: true }), { initialProps: { k: "a" } });
    await waitFor(() => expect(kept.result.current.data).toBe("data:a"));
    kept.rerender({ k: "b" });
    expect(kept.result.current).toMatchObject({ data: "data:a", loading: true });
    await waitFor(() => expect(kept.result.current.data).toBe("data:b"));
  });

  it("reports errors", async () => {
    const error = new Error("boom");
    const { result } = renderHook(() => useQuery("fails", () => Promise.reject(error)));
    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.loading).toBe(false);
  });
});

describe("useAction", () => {
  it("is busy while running and refreshes queries after", async () => {
    let n = 0;
    const query = renderHook(() => useQuery("after-action", async () => ++n));
    await waitFor(() => expect(query.result.current.data).toBe(1));

    let release!: () => void;
    const { result } = renderHook(() => useAction());
    let done!: Promise<string>;
    act(() => {
      done = result.current[0](() => new Promise<string>((resolve) => (release = () => resolve("ok"))));
    });
    expect(result.current[1]).toBe(true);
    await act(async () => {
      release();
      expect(await done).toBe("ok");
    });
    expect(result.current[1]).toBe(false);
    await waitFor(() => expect(query.result.current.data).toBe(2));
  });

  it("is not busy any more after a failure, and rethrows", async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      await expect(result.current[0](() => Promise.reject(new Error("no")))).rejects.toThrow("no");
    });
    expect(result.current[1]).toBe(false);
  });
});
