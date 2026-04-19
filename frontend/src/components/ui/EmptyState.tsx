export function EmptyState({ title, description }: { title: string; description: string }): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-description">{description}</div>
    </div>
  );
}
