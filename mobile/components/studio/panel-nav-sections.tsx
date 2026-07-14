import { CourseArtwork } from "@/components/learn/course-artwork";
import { CourseGeneratorPanel } from "@/components/studio/course-generator-panel";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useEducatorCourses, useToggleCourseActive, useUpdateEducatorCourse, type EducatorCourse } from "@/lib/hooks/educator/use-courses";
import { canManageBounties, canReviewApplications, type CurrentUser } from "@/lib/hooks/use-current-user";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { Course } from "@/types";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";

/**
 * Studio home's navigation, reframed to mirror the app's own Learn/Explore
 * tabs instead of a flat list of content-type editors. Expanding a section
 * shows the same lists a learner would see; leaf rows route to the existing
 * editor screens unchanged — this only changes how you get there.
 */

export function SectionShell({
  icon, label, meta, open, onToggle, accent, children,
}: Readonly<{
  icon: string; label: string; meta: string; open: boolean; onToggle: () => void;
  accent: string; children: ReactNode;
}>) {
  const M = useMuseumTheme();
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: "row", alignItems: "center",
          borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
          backgroundColor: M.card, borderWidth: 1,
          borderColor: open ? accent : M.border,
        }}
        className="active:opacity-70"
      >
        <View
          style={{
            width: 40, height: 40, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            backgroundColor: `${accent}15`, marginRight: 12,
          }}
        >
          <IconSymbol name={icon as never} size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>{label}</Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>{meta}</Text>
        </View>
        <IconSymbol name={open ? "chevron.up" : "chevron.down"} size={14} color={open ? accent : M.muted} />
      </Pressable>
      {open && (
        <View style={{ gap: 6, paddingLeft: 14, marginLeft: 20, borderLeftWidth: 2, borderLeftColor: M.border }}>
          {children}
        </View>
      )}
    </View>
  );
}

export function SubRow({ label, meta, onPress, badge }: Readonly<{ label: string; meta?: string; onPress: () => void; badge?: string }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: M.bg,
      }}
      className="active:opacity-70"
    >
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: M.muted }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{label}</Text>
        {meta ? <Text style={{ marginTop: 1, fontSize: 10.5, color: M.muted }}>{meta}</Text> : null}
      </View>
      {badge ? (
        <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: getAccent("teal").solid }}>{badge}</Text>
      ) : null}
      <IconSymbol name="chevron.right" size={12} color={M.muted} />
    </Pressable>
  );
}

const CAROUSEL_CARD_WIDTH = 168;

function CourseCarouselCard({
  course,
  onPress,
  onToggleActive,
  onDrag,
  dragging,
  toggling,
}: Readonly<{
  course: EducatorCourse;
  onPress: () => void;
  onToggleActive: () => void;
  onDrag: () => void;
  dragging: boolean;
  toggling: boolean;
}>) {
  const M = useMuseumTheme();
  const isActive = course.isActive !== false;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDrag}
      delayLongPress={200}
      style={{
        width: CAROUSEL_CARD_WIDTH, borderRadius: 16, overflow: "hidden",
        backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
        opacity: dragging ? 0.85 : 1,
      }}
      className="active:opacity-80"
    >
      <CourseArtwork course={course as unknown as Course} size="thumb" height={92} />
      <View style={{ padding: 10, gap: 6 }}>
        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "700", color: M.text, minHeight: 34 }}>
          {localize(course.title, "en")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => onToggleActive()}
            disabled={toggling}
            style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
              backgroundColor: isActive ? getAccent("teal").bg : M.bg,
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <IconSymbol name={isActive ? "eye" : "eye.slash"} size={10} color={isActive ? getAccent("teal").solid : M.muted} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? getAccent("teal").solid : M.muted }}>
              {toggling ? "…" : isActive ? "Active" : "Hidden"}
            </Text>
          </Pressable>
          <Pressable onPressIn={onDrag} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconSymbol name="line.3.horizontal" size={13} color={M.muted} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

interface SectionProps {
  currentUser: CurrentUser;
  activeLanguageId: string;
  open: boolean;
  onToggle: () => void;
}

export function LearnSection({
  activeLanguageId, open, onToggle, onSelectCourse, onToastSuccess, onToastError,
}: SectionProps & {
  onSelectCourse: (course: EducatorCourse) => void;
  onToastSuccess: (title: string, body: string) => void;
  onToastError: (title: string, body: string) => void;
}) {
  const M = useMuseumTheme();
  const { data: courses = [] } = useEducatorCourses(open);
  const toggleCourse = useToggleCourseActive();
  const updateCourse = useUpdateEducatorCourse();

  const languageCourses = useMemo(
    () => courses.filter((c) => c.languageId === activeLanguageId).sort((a, b) => a.order - b.order),
    [courses, activeLanguageId],
  );

  // Local drag order, synced from the server list — the draggable list needs
  // a controlled `data` array to animate reordering, separate from the
  // react-query cache it's derived from.
  const [dragOrder, setDragOrder] = useState<EducatorCourse[]>(languageCourses);
  useEffect(() => { setDragOrder(languageCourses); }, [languageCourses]);

  const handleDragEnd = ({ data }: { data: EducatorCourse[] }) => {
    setDragOrder(data);
    data.forEach((course, index) => {
      if (course.order !== index) {
        updateCourse.mutate({ id: course.id, order: index });
      }
    });
  };

  return (
    <SectionShell
      icon="book.fill"
      label="Learn"
      meta={`${languageCourses.length} course${languageCourses.length === 1 ? "" : "s"}`}
      open={open}
      onToggle={onToggle}
      accent={M.accent}
    >
      {languageCourses.length > 0 ? (
        <>
          <DraggableFlatList<EducatorCourse>
            data={dragOrder}
            keyExtractor={(course) => course.id}
            onDragEnd={handleDragEnd}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4, paddingVertical: 3 }}
            renderItem={({ item: course, drag, isActive }: RenderItemParams<EducatorCourse>) => (
              <ScaleDecorator>
                <CourseCarouselCard
                  course={course}
                  onPress={() => onSelectCourse(course)}
                  onDrag={drag}
                  dragging={isActive}
                  onToggleActive={() =>
                    toggleCourse.mutate(
                      { id: course.id, isActive: course.isActive === false },
                      {
                        onSuccess: () =>
                          onToastSuccess(
                            course.isActive !== false ? "Course hidden" : "Course published",
                            localize(course.title, "en"),
                          ),
                        onError: (err: Error) => onToastError("Failed", err.message),
                      },
                    )
                  }
                  toggling={toggleCourse.isPending && toggleCourse.variables?.id === course.id}
                />
              </ScaleDecorator>
            )}
          />
          <Text style={{ fontSize: 10.5, color: M.muted, paddingHorizontal: 2, marginTop: 2 }}>
            Long-press a course to drag and reorder.
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: M.muted, paddingVertical: 6, paddingHorizontal: 12 }}>
          No courses yet for this language.
        </Text>
      )}
      <View style={{ marginTop: 4 }}>
        <CourseGeneratorPanel
          activeLanguageId={activeLanguageId}
          languageCourses={languageCourses}
          onSuccess={onToastSuccess}
          onError={onToastError}
        />
      </View>
    </SectionShell>
  );
}

export function ExploreSection({ currentUser, open, onToggle }: SectionProps) {
  const router = useRouter();

  return (
    <SectionShell
      icon="globe.fill"
      label="Explore"
      meta={currentUser.isAdmin ? "4 sections" : "2 sections"}
      open={open}
      onToggle={onToggle}
      accent={getAccent("purple").solid}
    >
      <SubRow label="Dictionary" meta="Words, translations, audio" onPress={() => router.push("/educator/dictionary" as never)} />
      <SubRow label="Cultural" meta="Cultural notes, ceremonies" onPress={() => router.push("/educator/culture" as never)} />
      {currentUser.isAdmin && (
        <>
          <SubRow label="Discover" meta="Blogs, podcasts, films" badge="Admin" onPress={() => router.push("/admin/culture-content" as never)} />
          <SubRow label="Today" meta="Word / proverb / song of the day" badge="Admin" onPress={() => router.push("/admin/daily-content" as never)} />
        </>
      )}
    </SectionShell>
  );
}

export function StoriesSection({ open, onToggle }: SectionProps) {
  const router = useRouter();

  return (
    <SectionShell
      icon="character.book.closed"
      label="Stories"
      meta="Seasons & interactive"
      open={open}
      onToggle={onToggle}
      accent={getAccent("amber").solid}
    >
      <SubRow label="Seasons" meta="Narrative chapters threaded through a course" onPress={() => router.push("/educator/stories" as never)} />
      <SubRow label="Interactive Stories" meta="Branching scenes with choices" onPress={() => router.push("/educator/interactive-stories" as never)} />
    </SectionShell>
  );
}

/** Flat, visually quieter strip of pill links — for items with no single
 * learner screen to mirror, so they don't get forced into the Learn/Explore
 * metaphor. Shared by the educator and admin panel homes. */
export function ToolsGrid({ title, tools }: Readonly<{ title: string; tools: { label: string; href: string }[] }>) {
  const M = useMuseumTheme();
  const router = useRouter();

  return (
    <View>
      <Text style={{ fontSize: 9.5, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: M.muted, marginBottom: 10 }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {tools.map((tool) => (
          <Pressable
            key={tool.label}
            onPress={() => router.push(tool.href as never)}
            style={{
              borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9,
              backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
            }}
            className="active:opacity-70"
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: M.sub }}>{tool.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ToolsStrip({ currentUser }: Readonly<{ currentUser: CurrentUser }>) {
  const tools: { label: string; href: string }[] = [
    { label: "Review", href: "/review" },
    { label: "Proverbs", href: "/educator/proverbs" },
    { label: "Etymology", href: "/educator/etymology" },
    { label: "Sentences", href: "/educator/sentences" },
    { label: "Scenarios", href: "/educator/scenarios" },
    { label: "Quiz Bank", href: "/educator/quiz-bank" },
    { label: "Translations", href: "/educator/translations" },
    ...(currentUser.isAdmin ? [{ label: "Media Library", href: "/admin/media" }] : []),
    ...(canManageBounties(currentUser) ? [{ label: "Bounties", href: "/bounties" }] : []),
    ...(canReviewApplications(currentUser) ? [{ label: "Applications", href: "/educator/applications" }] : []),
  ];

  return <ToolsGrid title="Tools" tools={tools} />;
}
