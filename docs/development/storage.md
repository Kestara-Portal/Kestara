# Storage Guide

> Status: E01 buckets/policies are implemented in `supabase/migrations/20261110090300_storage_e01.sql`. Runtime verification requires local Supabase.

## Buckets (private by default)

| Bucket | Purpose | Visibility |
|---|---|---|
| `profile-avatars` | Profile photos | Private, owner-only |
| `portfolio-files` | Portfolio media | Private, owner-only |

Application documents / CVs are **not** created here. They belong to the future E05 (application + blind profile) module and require a separate privacy review.

## Object path convention

```
profile-avatars/{user_id}/{file_id}.{ext}
portfolio-files/{user_id}/{item_id}/{file_id}.{ext}
```

The first path segment must equal `auth.uid()`. Storage policies enforce this with `(storage.foldername(name))[1] = auth.uid()::text`.

Path builders live in `lib/storage/paths.ts`:

- `buildAvatarPath(userId, fileId, ext)`
- `buildPortfolioMediaPath(userId, itemId, fileId, ext)`

Rules:

- Never trust a client-supplied path as proof of ownership.
- Use generated IDs, not original filenames, and keep PII out of object names.
- Validate MIME type and size during upload (not only the browser `accept` attribute).
- Use short-lived signed URLs for private downloads; never store them in the database.
- Do not put CVs or sensitive files in public buckets.

## Upload flow (application layer)

1. Authenticate the caller (`requireUser`).
2. Build the path with the caller's own `auth.uid()`.
3. Upload through the user-scoped server/browser client (RLS applies).
4. Persist the object path (not a public URL) in `avatar_path` / `media_path`.

## Testing

Verify (with local Supabase): user A cannot read/write user B's objects, anon is denied, unpublished/unowned access fails, invalid types/sizes are rejected.
