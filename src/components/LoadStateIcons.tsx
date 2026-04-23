type IconProps = {
  className?: string;
  label: string;
};

export function SpinnerIcon({ className, label }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="42"
        strokeDashoffset="10"
        className="spinner-arc"
      />
    </svg>
  );
}

export function ErrorIcon({ className, label }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5.2M12 16.1h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
