import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarPicker({
  value,
  onChange,
  onClose,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
}) {
  const M = useMuseumTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initial = value ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (day: number) => new Date(viewYear, viewMonth, day) < today;
  const isSelected = (day: number) =>
    value &&
    value.getFullYear() === viewYear &&
    value.getMonth() === viewMonth &&
    value.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <View className="rounded-2xl bg-white p-4 dark:bg-neutral-900">
      {/* Month/year nav */}
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={prevMonth}
          disabled={!canGoPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="p-2"
        >
          <IconSymbol
            name="chevron.left"
            size={18}
            color={canGoPrev ? M.text : M.border}
          />
        </Pressable>
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable
          onPress={nextMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="p-2"
        >
          <IconSymbol name="chevron.right" size={18} color={M.text} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View className="mb-1 flex-row">
        {DAYS.map((d) => (
          <View key={d} className="flex-1 items-center">
            <Text className="text-xs font-medium text-neutral-400">{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`e-${i}`} style={{ width: `${100 / 7}%` }} />;
          }
          const past = isPast(day);
          const selected = isSelected(day);
          const todayCell = isToday(day);
          return (
            <Pressable
              key={day}
              onPress={() => {
                if (!past) {
                  onChange(new Date(viewYear, viewMonth, day));
                  onClose();
                }
              }}
              disabled={past}
              accessibilityRole="button"
              accessibilityLabel={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
              accessibilityState={{ selected: !!selected, disabled: past }}
              style={{ width: `${100 / 7}%` }}
              className="items-center py-1"
            >
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  selected
                    ? "bg-blue-500"
                    : todayCell
                    ? "border border-blue-400"
                    : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selected
                      ? "text-white"
                      : past
                      ? "text-neutral-300 dark:text-neutral-600"
                      : "text-neutral-900 dark:text-white"
                  }`}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DueDatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const dateStr = value
    ? value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={
          value ? `${t("classroom.dueDate")}: ${dateStr}` : t("classroom.setDueDate")
        }
        className="flex-row items-center rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800"
      >
        <IconSymbol name="calendar.badge.plus" size={18} color={M.muted} />
        {dateStr ? (
          <Text className="ml-2 flex-1 text-base text-neutral-900 dark:text-white">
            {dateStr}
          </Text>
        ) : (
          <Text className="ml-2 flex-1 text-base text-neutral-400 dark:text-neutral-500">
            {t("classroom.setDueDate")}
          </Text>
        )}
        {value && (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityLabel="Clear due date"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark.circle.fill" size={20} color={M.muted} />
          </Pressable>
        )}
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setShowPicker(false)}
        />
        <View className="bg-white px-4 pb-8 pt-3 dark:bg-neutral-900">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => { onChange(null); setShowPicker(false); }}
              accessibilityRole="button"
            >
              <Text className="text-base text-neutral-500">Clear</Text>
            </Pressable>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              {t("classroom.dueDate")}
            </Text>
            <Pressable onPress={() => setShowPicker(false)} accessibilityRole="button">
              <Text className="text-base font-semibold text-blue-500">Done</Text>
            </Pressable>
          </View>
          <CalendarPicker
            value={value}
            onChange={onChange}
            onClose={() => setShowPicker(false)}
          />
        </View>
      </Modal>
    </View>
  );
}
