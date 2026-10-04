import type { HTMLAttributes } from 'react';

export function Skeleton({ className = '', style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`skel ${className}`.trim()} style={style} aria-hidden="true" {...rest} />;
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '🔍', title, description, action, ...rest }: EmptyStateProps) {
  return (
    <div className="empty" {...rest}>
      {icon ? <div className="ic">{icon}</div> : null}
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}