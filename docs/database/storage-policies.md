# Kestara — Supabase Storage Policy Blueprint

> **Status:** Draft — proposed buckets only; no Supabase project or bucket has been created  
> **Default stance:** Private by default, public only after an explicit product decision.

## 1. Purpose

This document classifies files that may be uploaded or served by Kestara and defines the policy decisions required before implementing Supabase Storage.

Storage authorization is separate from PostgreSQL table RLS. Both must be designed and tested.

## 2. Proposed Bucket Inventory

Bucket names are proposals and may change after review.

| Proposed bucket | File purpose | Default visibility | Likely uploader |
|---|---|---|---|
| `profile-avatars` | Profile photographs | Private pending approval | Authenticated user for own profile |
| `portfolio-files` | Portfolio images/documents | Private | Owner |
| `application-documents` | CV and application attachments | Private, sensitive | Applicant |
| `company-assets` | Company logo and approved public assets | Private until approved | Authorized company recruiter/Admin |
| `learning-materials` | Micro-learning media/documents | Private or published access via controlled policy | Admin |

Do not create all buckets automatically. Confirm which file types and workflows are actually required by the approved requirements.

## 3. Object Path Convention

Use opaque, ownership-oriented paths. Example patterns:

```text
profile-avatars/{user_id}/{file_id}.{ext}
portfolio-files/{user_id}/{file_id}.{ext}
application-documents/{user_id}/{application_id}/{file_id}.{ext}
company-assets/{company_id}/{file_id}.{ext}
learning-materials/{module_id}/{file_id}.{ext}
```

These are path proposals, not finalized contracts.

Rules:
- Derive ownership from the authenticated user and database relationships.
- Do not trust a user-supplied path as proof of ownership.
- Avoid names, email addresses, phone numbers, or other PII in object paths.
- Use generated IDs rather than original filenames for stored object names.
- Validate that the user is authorized for the related application, company, or learning module.

## 4. Access Rules

### Profile avatars

- A user may upload, replace, and delete their own avatar.
- Default private access until product approves public profile visibility.
- If public profile images are required, publish only the approved image derivative, not the private original.

### Portfolio files

- Owner may manage their own files.
- Other users cannot list or download private objects directly.
- If a portfolio item is explicitly published, access must follow an approved visibility model.
- Do not assume every Recruiter may access every portfolio file.

### Application documents

- Applicant may upload and manage their own documents subject to application lifecycle rules.
- Recruiter access is scoped to the relevant authorized application and company.
- Blind screening must not expose a file URL, original filename, EXIF metadata, or document content that reveals identity when those fields are prohibited.
- Prefer controlled server-side access or short-lived signed URLs after authorization.

### Company assets

- Only an authorized active company member or Admin may upload/replace company assets.
- Public visibility requires an approved company publication state.
- A recruiter must not modify assets for an unrelated company.

### Learning materials

- Admin manages uploads.
- Users may access only published material intended for their role/audience.
- Unpublished or draft material remains private.

## 5. Upload Validation

Enforce, as appropriate:
- Allowed MIME types and file extensions.
- Maximum file size per bucket.
- Generated storage filenames.
- File content inspection where risk warrants it.
- Authorization to the parent database record.
- Safe handling of SVG, HTML, and other active content.
- Malware scanning or moderation if required by deployment policy.

Do not rely solely on the browser's `accept` attribute or a MIME type supplied by the client.

Exact limits and allowed formats are TBD and must be agreed by the team.

## 6. Signed URL Rules

- Use short-lived signed URLs for private downloads.
- Generate the URL only after checking the caller's authorization to the related record.
- Never store long-lived signed URLs in database records.
- Do not log signed URL tokens.
- Re-check access when generating a new URL; possession of an old URL should not become the application's permanent authorization model.

## 7. Deletion and Retention

- Replacing an avatar may require deleting the old object after the new object is confirmed.
- Deleting a portfolio record and deleting its file should be coordinated safely.
- Cancelling an application must not automatically destroy required application history or documents unless policy says so.
- Account deactivation does not automatically imply physical deletion of files.
- Hard deletion and retention rules require product/legal/academic approval.

## 8. Storage Security Test Cases

- User A cannot upload into User B's path.
- User A cannot overwrite or delete User B's file.
- User A cannot download User B's private portfolio file.
- Recruiter A cannot download an application document for an unrelated company.
- Blind Profile flow does not reveal private document URLs or identifying metadata.
- Unpublished learning content cannot be downloaded by ordinary users.
- Recruiter cannot upload to a company without active membership.
- Invalid file types and oversized files are rejected.
- Deactivated accounts cannot perform protected uploads.
- Signed URL generation fails for unauthorized users.

---

**Status:** Draft. Confirm file workflows, formats, size limits, visibility, and retention before creating Storage buckets or policies.
