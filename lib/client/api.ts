export type ApiFieldErrors = Record<string, string>;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fields: ApiFieldErrors };

interface ErrorEnvelope {
  error?: { message?: string; fields?: ApiFieldErrors };
}

// Small client helper for the Kestara JSON API envelope.
export async function apiRequest<T>(
  url: string,
  options: { method: string; body?: unknown },
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const payload = (await response.json().catch(() => null)) as
      | (ErrorEnvelope & { data?: T })
      | null;

    if (!response.ok) {
      return {
        ok: false,
        message:
          payload?.error?.message ??
          "Perubahan belum dapat disimpan. Periksa koneksi lalu coba lagi.",
        fields: payload?.error?.fields ?? {},
      };
    }

    return { ok: true, data: (payload?.data ?? (payload as T)) as T };
  } catch {
    return {
      ok: false,
      message: "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      fields: {},
    };
  }
}
