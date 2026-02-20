import type { StoryArc } from "@/types";

export const IZON_BASICS_STORY: StoryArc = {
  id: "story-izon-basics",
  courseId: "course-1",
  title: "Tari's Journey Home",
  description:
    "Follow Tari, a young Izon person returning to the Niger Delta to visit their grandmother. Along the way, Tari rediscovers the beauty of the Izon language through everyday conversations, stories, and family traditions.",
  chapters: [
    {
      id: "ch-1",
      lessonId: "lesson-1",
      title: "Arriving at the Waterside",
      narrativeIntro:
        "Tari steps off the boat onto the wooden jetty at Grandmother Ebiere's village. The air smells of river water and woodsmoke. Grandmother is waiting with open arms, but she greets Tari only in Izon — it is time to learn the old words again.",
      narrativeOutro:
        "Tari can now greet the elders properly and introduce themselves at the village gathering. Grandmother Ebiere smiles proudly, but says there is much more to learn before the week is over.",
      order: 1,
    },
    {
      id: "ch-2",
      lessonId: "lesson-2",
      title: "Stories by the Fireside",
      narrativeIntro:
        "That evening, the family gathers around the fire pit behind the house. Grandmother begins to tell the old story of the tortoise who outsmarted the river spirits. She tells it in Izon, pausing to make sure Tari follows along.",
      narrativeOutro:
        "Tari is captivated by the tale of the clever tortoise. The story reveals how Izon words carry the wisdom of generations. Tomorrow, Grandmother promises a trip to the market — and a lesson in numbers.",
      order: 2,
    },
    {
      id: "ch-3",
      lessonId: "lesson-3",
      title: "Counting at the Market",
      narrativeIntro:
        "Morning light dances across the creek as Tari and Grandmother paddle to the floating market. Stalls overflow with plantains, dried fish, and woven baskets. Grandmother hands Tari a few naira notes and says: 'Today, you buy everything yourself — in Izon.'",
      narrativeOutro:
        "Tari successfully bargains for fresh fish and a bundle of plantains, counting out the price in Izon. The market women are impressed. On the paddle home, Grandmother says the family will gather tonight — time to learn everyone's names and titles.",
      order: 3,
    },
    {
      id: "ch-4",
      lessonId: "lesson-4",
      title: "The Family Gathering",
      narrativeIntro:
        "Aunties, uncles, and cousins have come from neighboring villages for a family gathering. Grandmother insists that Tari greet each relative with the proper Izon title. 'In our language, how you address someone shows respect,' she explains.",
      narrativeOutro:
        "Tari now knows the Izon words for mother, father, uncle, aunty, grandparent, and cousin. Uncle Ebi is so pleased he invites Tari to join the morning fishing trip. But first, Grandmother has one final lesson planned.",
      order: 4,
    },
    {
      id: "ch-5",
      lessonId: "lesson-5",
      title: "A Day in the Village",
      narrativeIntro:
        "It is Tari's last full day in the village. From dawn prayers to the evening meal, Grandmother walks Tari through the rhythm of daily life — waking, cooking, fishing, resting — describing each activity in Izon. 'When you return to the city, carry these words with you,' she says.",
      narrativeOutro:
        "As the sun sets over the creek, Tari sits with Grandmother on the veranda and recounts the entire day in Izon. The words feel natural now, like a song remembered from childhood. Tari promises to return soon — and to keep learning.",
      order: 5,
    },
  ],
};
