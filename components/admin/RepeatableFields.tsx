"use client";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "checkbox" | "select";
  options?: string[];
  wide?: boolean; // takes full row width (for longer text like notes)
}

interface RepeatableRowsProps {
  label: string;
  helpText?: string;
  items: Record<string, unknown>[];
  fields: FieldDef[];
  emptyItem: Record<string, unknown>;
  onChange: (items: Record<string, unknown>[]) => void;
}

export function RepeatableRows({
  label,
  helpText,
  items,
  fields,
  emptyItem,
  onChange,
}: RepeatableRowsProps) {
  function updateItem(index: number, key: string, value: unknown) {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { ...emptyItem }]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-medium text-brand hover:underline"
        >
          + Add
        </button>
      </div>
      {helpText && <p className="mt-0.5 text-xs text-muted">{helpText}</p>}

      <div className="mt-2 space-y-3">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
            None added yet.
          </p>
        )}
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-line bg-canvas p-3">
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <div key={field.key} className={field.wide ? "w-full" : "min-w-[140px] flex-1"}>
                  <label className="mb-1 block text-xs text-muted">{field.label}</label>
                  {field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(item[field.key])}
                      onChange={(e) => updateItem(index, field.key, e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={String(item[field.key] ?? "")}
                      onChange={(e) => updateItem(index, field.key, e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(item[field.key] ?? "")}
                      placeholder={field.placeholder}
                      onChange={(e) => updateItem(index, field.key, e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-2 text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple one-item-per-line text list editor (used for "local food"). */
export function ListTextArea({
  label,
  helpText,
  items,
  onChange,
}: {
  label: string;
  helpText?: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {helpText && <p className="mb-1 text-xs text-muted">{helpText}</p>}
      <textarea
        rows={4}
        value={items.join("\n")}
        onChange={(e) =>
          onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
        }
        placeholder={"One per line, e.g.\nDal Baati Churma\nGhewar"}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm"
      />
    </label>
  );
}
