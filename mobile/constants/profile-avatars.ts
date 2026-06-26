export interface ProfileAvatar {
  id: string;
  icon: string;
  bg: string;
  fg: string;
  label: string;
}

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "witness",     icon: "eye.fill",              bg: "#1C2E4A", fg: "#7EB8F7", label: "Witness"     },
  { id: "connector",   icon: "hand.raised.fill",       bg: "#854D0E", fg: "#FEF08A", label: "Connector"   },
  { id: "exchange",    icon: "arrow.left.arrow.right",  bg: "#9A3412", fg: "#FDBA74", label: "Exchange"    },
  { id: "keeper",      icon: "flame.fill",             bg: "#7C2D12", fg: "#FCA5A5", label: "Keeper"      },
  { id: "elder",       icon: "person.fill",            bg: "#27272A", fg: "#D4D4D8", label: "Elder"       },
  { id: "seeker",      icon: "bolt.fill",              bg: "#C4862A", fg: "#FFF7ED", label: "Seeker"      },
  { id: "explorer",    icon: "globe.fill",             bg: "#064E3B", fg: "#6EE7B7", label: "Explorer"    },
  { id: "scholar",     icon: "book.fill",              bg: "#3730A3", fg: "#A5B4FC", label: "Scholar"     },
  { id: "storyteller", icon: "music.note",             bg: "#881337", fg: "#FDA4AF", label: "Storyteller" },
  { id: "grower",      icon: "leaf.fill",              bg: "#14532D", fg: "#86EFAC", label: "Grower"      },
  { id: "luminary",    icon: "star.fill",              bg: "#78350F", fg: "#FDE68A", label: "Luminary"    },
  { id: "dreamer",     icon: "moon.fill",              bg: "#1E1B4B", fg: "#C4B5FD", label: "Dreamer"     },
];

export const AVATARS_PER_PAGE = 6;

export const AVATAR_PAGES: ProfileAvatar[][] = [];
for (let i = 0; i < PROFILE_AVATARS.length; i += AVATARS_PER_PAGE) {
  AVATAR_PAGES.push(PROFILE_AVATARS.slice(i, i + AVATARS_PER_PAGE));
}
