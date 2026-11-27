import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Satu keluarga ikon garis untuk seluruh landing page: viewBox 24, stroke 1.6,
 * ujung membulat, warna mengikuti currentColor. Ikon dipilih karena relevan
 * dengan modul yang ditampilkan, bukan karena gaya library tertentu.
 */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconProfile(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.6 20c.7-3.5 3.5-5.4 7.4-5.4s6.7 1.9 7.4 5.4" />
    </Icon>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.2" y="7.6" width="17.6" height="12" rx="2.4" />
      <path d="M9 7.6V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2v1.4" />
      <path d="M3.2 12.6h17.6" />
    </Icon>
  );
}

export function IconBookOpen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.6C10.2 5.1 7.9 4.6 4.6 4.6v13c3.3 0 5.6.5 7.4 2 1.8-1.5 4.1-2 7.4-2v-13c-3.3 0-5.6.5-7.4 2Z" />
      <path d="M12 6.6v13" />
    </Icon>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V6.6A1.6 1.6 0 0 1 5.6 5h4.2a1.6 1.6 0 0 1 1.6 1.6V20" />
      <path d="M11.4 20v-8.4A1.6 1.6 0 0 1 13 10h4.4A1.6 1.6 0 0 1 19 11.6V20" />
      <path d="M3 20h18" />
      <path d="M7 9h1.4M7 12.4h1.4" />
    </Icon>
  );
}

export function IconFileSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 3.6H7.6A1.6 1.6 0 0 0 6 5.2v13.6a1.6 1.6 0 0 0 1.6 1.6h8.8a1.6 1.6 0 0 0 1.6-1.6V8Z" />
      <path d="M14 3.6V8h4" />
      <circle cx="11.4" cy="13.8" r="2.1" />
      <path d="M12.9 15.3 15 17.4" />
    </Icon>
  );
}

export function IconClipboardCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="4.6" width="14" height="15.8" rx="2.2" />
      <path d="M9.2 4.6V3.6h5.6v1" />
      <path d="M9 12.4l2 2 4-4.2" />
    </Icon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.6" r="3.2" />
      <path d="M3 20c.5-3.2 2.9-5 6-5s5.5 1.8 6 5" />
      <path d="M16.2 5.6a3.1 3.1 0 0 1 0 6" />
      <path d="M18.2 20c-.2-2-.9-3.4-1.9-4.3" />
    </Icon>
  );
}

export function IconMessages(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.4h11.4v7.4H9.4L5.8 16v-3.2H4Z" />
      <path d="M20 10v6.4h-1.6v2.8L15.2 16H10" />
    </Icon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}