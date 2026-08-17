import { CheckCircle2, Circle } from "lucide-react";
import columnIcons, {
  DEFAULT_COLUMN_ICON_NAMES,
} from "@/constants/column-icons";

export const getColumnIcon = (
  columnId: string,
  isFinal?: boolean,
  iconName?: string | null,
  color?: string | null,
) => {
  const resolvedIconName =
    iconName ||
    DEFAULT_COLUMN_ICON_NAMES[
      columnId as keyof typeof DEFAULT_COLUMN_ICON_NAMES
    ];
  const Icon =
    resolvedIconName &&
    columnIcons[resolvedIconName as keyof typeof columnIcons];
  const style = color ? { color } : undefined;
  const className = color
    ? "w-4 h-4"
    : "w-4 h-4 text-muted-foreground";

  if (Icon) {
    return <Icon className={className} style={style} />;
  }

  return isFinal ? (
    <CheckCircle2 className={className} style={style} />
  ) : (
    <Circle className={className} style={style} />
  );
};

export function columnAccentStyle(color?: string | null): {
  boxShadow?: string;
} {
  if (!color) return {};
  return { boxShadow: `inset 3px 0 0 0 ${color}` };
}
