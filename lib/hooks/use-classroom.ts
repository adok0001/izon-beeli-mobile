import { useClassroomStore } from "@/store/classroom-store";

export function useClassroom() {
  const store = useClassroomStore();
  return store;
}

export function useGroupDetail(groupId: string) {
  const group = useClassroomStore((s) => s.getGroup(groupId));
  const assignments = useClassroomStore((s) =>
    s.getAssignmentsForGroup(groupId)
  );
  return { group, assignments };
}
