export interface AvatarProps {
  name: string;
  size?: 'md' | 'lg';
  verified?: boolean;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', verified = false, className = '' }: AvatarProps) {
  const classes = ['avatar', size === 'lg' ? 'avatar-lg' : '', verified ? 'avatar-plus' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} aria-label={name}>
      {initials(name)}
      {verified ? <span className="v">✓</span> : null}
    </span>
  );
}