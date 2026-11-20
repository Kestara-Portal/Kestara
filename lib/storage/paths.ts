export const AVATAR_BUCKET = "profile-avatars";
export const PORTFOLIO_BUCKET = "portfolio-files";

function safeExtension(ext: string): string {
  return ext.replace(/^\./, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Object path for a profile avatar inside the `profile-avatars` bucket.
 * Shape: `{user_id}/{file_id}.{ext}`. The first path segment must equal
 * auth.uid() for the storage policy to allow access.
 */
export function buildAvatarPath(userId: string, fileId: string, ext: string): string {
  return `${userId}/${fileId}.${safeExtension(ext)}`;
}

/**
 * Object path for portfolio media inside the `portfolio-files` bucket.
 * Shape: `{user_id}/{item_id}/{file_id}.{ext}`.
 */
export function buildPortfolioMediaPath(
  userId: string,
  itemId: string,
  fileId: string,
  ext: string,
): string {
  return `${userId}/${itemId}/${fileId}.${safeExtension(ext)}`;
}
