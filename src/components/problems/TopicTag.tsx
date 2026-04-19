import { Topic } from "@/data/types";

export default function TopicTag({
  topic,
  active,
  onClick,
}: {
  topic: Topic | "All";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-accent-green text-bg-primary"
          : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      }`}
    >
      {topic}
    </button>
  );
}
