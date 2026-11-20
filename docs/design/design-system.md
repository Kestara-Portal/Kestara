# Kestara — Design System

> **Status:** Draft  
> **Brand direction:** Green Teal  
> **Primary color:** `#176B62`

## 1. Design Principles

1. Clear and approachable: reduce cognitive load in job search and career development.
2. Inclusive: support varied abilities, devices, and levels of digital literacy.
3. Consistent: the same component should behave consistently across roles.
4. Trustworthy: make privacy, status, and next actions understandable.
5. Competency-focused: make skills and portfolio information easy to understand.
6. Responsive: support mobile, tablet, and desktop layouts.

## 2. Visual Foundation

### Color

Use `color-palette.md`. Green Teal is the confirmed direction; supporting color tokens are proposals until reviewed.

### Typography

- First inspect the existing app font configuration.
- Preserve the existing Geist setup if it is already integrated and approved.
- Do not add another font dependency without a reason.
- Use a clear type scale with distinct page title, section title, body, label, and helper text roles.
- Avoid tiny text for essential instructions.

### Spacing and layout

Proposed spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 px. Use a consistent spacing scale rather than arbitrary one-off values.

- Prefer readable content widths.
- Use consistent page gutters.
- Use a responsive grid.
- Avoid excessive card nesting.
- Keep primary actions visually obvious.

### Shape and elevation

- Use consistent border radius tokens.
- Prefer subtle borders over heavy shadows.
- Use elevation to communicate hierarchy, not decoration.
- Ensure focus and hover states are visible.

## 3. Core Components

The component library should eventually document:

- Button: primary, secondary, outline, ghost, destructive, loading, disabled.
- Input: text, email, password, search, textarea, select, checkbox, radio.
- Form field: label, required marker, helper text, error.
- Card: default, interactive, selectable.
- Badge: status and category.
- Avatar: image, initials, fallback.
- Dialog and confirmation dialog.
- Dropdown menu.
- Tabs.
- Table/list.
- Pagination.
- Empty state.
- Skeleton/loading state.
- Toast/alert.
- File uploader with validation/progress.
- Modal/drawer for mobile-friendly actions.

## 4. Role-Aware Navigation

Navigation should adapt to role without duplicating the entire visual system.

- Jobseeker: profile, jobs, applications, learning, assessment, mentorship, community.
- Mentor: profile, skills/portfolio, availability, mentorship, community where enabled.
- Recruiter: profile, skills/portfolio, company, jobs, applications/candidate screening.
- Admin: account administration, learning content, company administration, assessment administration, moderation.

This is a navigation proposal derived from the supplied module descriptions. Final menu visibility must match approved permissions and actual implemented features.

## 5. Interaction States

Every data-driven component should consider:
- Initial/loading.
- Empty/no results.
- Success.
- Validation error.
- Server/network error.
- Disabled/not authorized.
- Pending/review state where relevant.

Do not show a success state until the server confirms the operation.

## 6. Accessibility

- Use semantic HTML and correct heading hierarchy.
- Every input has a programmatic label.
- Keyboard users can reach and operate interactive controls.
- Focus indicators remain visible.
- Dialogs manage focus and Escape behavior appropriately.
- Images have meaningful alternative text when informative.
- Error messages identify the field and how to correct it.
- Respect reduced-motion preferences.
- Meet WCAG 2.2 AA targets where applicable.

## 7. Responsive Behavior

Design and test at narrow mobile, tablet, laptop, and wide desktop widths. Use responsive layouts rather than fixed-width assumptions. Tables may become stacked cards or horizontally scrollable regions where appropriate.

## 8. Implementation Rules

- Reuse existing components before creating duplicates.
- Keep components focused and typed.
- Keep business rules out of presentational components.
- Do not add a component library without approval and dependency review.
- Do not copy another site's branding, assets, text, or exact layout.
- Update this document when shared components or tokens change.
