export interface OutcomePreviewValue {
  percentage: number;
  absolute?: string;
  nnh?: number;
}

export interface OutcomePreviewItem {
  name: string;
  baseline?: string;
  value: OutcomePreviewValue;
  isPositive?: boolean;
}

export interface OutcomePreviewCategory {
  title: string;
  items: OutcomePreviewItem[];
  isSideEffectCategory?: boolean;
}

interface OutcomeLabelPreviewProps {
  title: string;
  subtitle?: string;
  tag?: string;
  data: OutcomePreviewCategory[];
}

function OutcomeBar({
  item,
  isSideEffect = false,
}: {
  item: OutcomePreviewItem;
  isSideEffect?: boolean;
}) {
  const barColor = isSideEffect
    ? "bg-amber-500"
    : item.isPositive === true
      ? "bg-green-600"
      : item.isPositive === false
        ? "bg-red-600"
        : "bg-gray-400";
  const textColor = isSideEffect
    ? "text-red-600"
    : item.isPositive === true
      ? "text-green-600"
      : item.isPositive === false
        ? "text-red-600"
        : "text-gray-700";
  const value = `${item.value.percentage > 0 ? "+" : ""}${item.value.percentage}%${
    item.value.absolute ? ` (${item.value.absolute})` : ""
  }${item.value.nnh ? ` (NNH: ${item.value.nnh})` : ""}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      <div className="flex items-center">
        <span className="text-sm">{item.name}</span>
        {item.baseline ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {item.baseline}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <span className={`text-sm font-medium ${textColor}`}>{value}</span>
        <div className="h-2 w-full rounded-full bg-gray-200 sm:w-16">
          <div
            className={`h-2 rounded-full ${barColor}`}
            style={{
              width: `${Math.min(Math.abs(item.value.percentage), 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function OutcomeLabelPreview({
  title,
  subtitle,
  tag,
  data,
}: OutcomeLabelPreviewProps) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-lg border bg-background p-4">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <span className="text-lg font-semibold">{title}</span>
        {tag ? (
          <span className="mt-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800 sm:mt-0">
            {tag}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="space-y-4">
        {data.map((category, index) => (
          <div
            key={category.title}
            className={index < data.length - 1 ? "mb-3 border-b pb-3" : ""}
          >
            <div className="mb-2 text-sm font-medium">{category.title}</div>
            <div className="space-y-3 sm:space-y-2">
              {category.items.map((item) => (
                <OutcomeBar
                  key={item.name}
                  item={item}
                  isSideEffect={category.isSideEffectCategory}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
