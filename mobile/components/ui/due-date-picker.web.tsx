import { useTranslation } from "react-i18next";

export function DueDatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <input
      type="date"
      aria-label={t("classroom.dueDate")}
      value={value ? value.toISOString().slice(0, 10) : ""}
      min={today.toISOString().slice(0, 10)}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(v + "T00:00:00") : null);
      }}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        fontSize: 15,
        width: "100%",
        marginBottom: 12,
        backgroundColor: "#f5f5f5",
        color: "#111827",
      }}
    />
  );
}
