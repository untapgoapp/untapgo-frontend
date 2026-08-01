export default function PlaygroupTimestamp({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt?: string;
}) {
  const created = new Date(createdAt);
  const updated = updatedAt ? new Date(updatedAt) : null;
  const valid = !Number.isNaN(created.getTime());
  if (!valid) return null;

  const edited = updated && !Number.isNaN(updated.getTime())
    ? updated.getTime() - created.getTime() > 1000
    : false;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <time dateTime={edited && updated ? updatedAt : createdAt} title={created.toLocaleString()}>
      {edited ? "Edited " : ""}{formatter.format(edited && updated ? updated : created)}
    </time>
  );
}
