import { Icon } from "../../lib/icons";

export function SectionTitle({
  title,
  action,
  onClick,
}: {
  title: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action ? (
        <button type="button" onClick={onClick}>
          {action} <Icon name="arrow" size={14} />
        </button>
      ) : null}
    </div>
  );
}
