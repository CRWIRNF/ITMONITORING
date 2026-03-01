interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'error';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusClasses = {
    online: 'status-badge status-online',
    offline: 'status-badge status-offline',
    warning: 'status-badge status-warning',
    error: 'status-badge status-error',
  };

  const statusText = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Warnung',
    error: 'Fehler',
  };

  return (
    <span className={statusClasses[status]}>
      {statusText[status]}
    </span>
  );
}
