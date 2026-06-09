import { flagUrl } from "../data/teams";

export default function Flag({
  code,
  className = "",
  title,
}: {
  code: string;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={flagUrl(code)}
      alt={title ?? code}
      title={title}
      loading="lazy"
      className={`object-cover ${className}`}
      draggable={false}
    />
  );
}
