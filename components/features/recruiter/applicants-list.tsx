interface ApplicantsListProps {
  children: React.ReactNode;
}

export default function ApplicantsList({ children }: ApplicantsListProps) {
  return (
    <section
      aria-label="Daftar pelamar"
      className="space-y-4"
    >
      {children}
    </section>
  );
}
