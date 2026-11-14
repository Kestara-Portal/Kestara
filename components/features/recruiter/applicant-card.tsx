interface ApplicantCardProps {
  children: React.ReactNode;
}

export default function ApplicantCard({ children }: ApplicantCardProps) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {children}
    </article>
  );
}
