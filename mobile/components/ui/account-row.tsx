import { AccountAvatar } from "@/components/ui/account-avatar";
import type { MergedAccountRow } from "@/lib/known-accounts";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface AccountRowProps {
  row: MergedAccountRow;
  trailing: ReactNode;
  size?: number;
}

/** Avatar + name + email row shared by the sign-back-in and manage-accounts screens. */
export function AccountRow({ row, trailing, size = 46 }: Readonly<AccountRowProps>) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <AccountAvatar imageUrl={row.imageUrl} hasImage={row.hasImage} name={row.firstName} size={size} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: size >= 46 ? 16 : 15, fontWeight: "800", color: M.text }}>
          {row.firstName ?? row.email ?? "Learner"}
        </Text>
        {row.email ? (
          <Text style={{ fontSize: size >= 46 ? 13 : 12, color: M.sub }} numberOfLines={1}>
            {row.email}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
