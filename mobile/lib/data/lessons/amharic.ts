/**
 * Amharic lessons — course-10 (First Words)
 */
import type { LessonData } from "./types";

export const AMHARIC_LESSONS: LessonData[] = [
  {
    id: "lesson-24", courseId: "course-10", title: "Maryam's Coffee Ceremony",
    description: "Maryam invites her neighbor for a traditional Ethiopian coffee ceremony — buna.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", duration: 30, order: 1,
    transcript: [
      { id: "ta1", startTime: 0, endTime: 3, text: "እንደምን አደርክ! ጎረቤት ጠራ", translation: "Good morning! a neighbor called out" },
      { id: "ta2", startTime: 3, endTime: 6.5, text: "ስሜ ማርያም ነው። ቡና ፈልተሽ?", translation: "My name is Maryam. Would you like coffee?" },
      { id: "ta3", startTime: 6.5, endTime: 10, text: "እንዴት ነህ? ጎረቤት ጠየቀ", translation: "How are you? the neighbor asked" },
      { id: "ta4", startTime: 10, endTime: 14, text: "ደህና ነኝ! ቡና ሲፈላ ጥሩ ሽታ አለው", translation: "I am fine! The coffee smells wonderful as it brews" },
      { id: "ta5", startTime: 14, endTime: 18, text: "አመሰግናለሁ! ይህ የቡና ሥርዓት ቆንጆ ነው", translation: "Thank you! This coffee ceremony is beautiful" },
      { id: "ta6", startTime: 18, endTime: 22, text: "ወዴት ነው የምትሄደው? ከቡና በኋላ?", translation: "Where are you going after coffee?" },
      { id: "ta7", startTime: 22, endTime: 26, text: "ወደ ገበያ እየሄድኩ ነው — ቅመማ ቅመም ለመግዛት", translation: "I am going to the market — to buy spices" },
      { id: "ta8", startTime: 26, endTime: 30, text: "ደህና ሁን! ቡና ደግሞ ጠብቂኝ!", translation: "Goodbye! Save me coffee again!" },
    ],
  },
  {
    id: "lesson-25", courseId: "course-10", title: "The Spice Market",
    description: "Maryam bargains for spices at the merkato — learning to count in Amharic.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 30, order: 2,
    transcript: [
      { id: "ta25-1", startTime: 0,  endTime: 4,  text: "እንኳን ደህና መጡ! ምን ይፈልጋሉ?",           translation: "Welcome! What are you looking for?" },
      { id: "ta25-2", startTime: 4,  endTime: 8,  text: "ቃሪያ እና ቁጥቁጥ እፈልጋለሁ።",              translation: "I want pepper and fenugreek." },
      { id: "ta25-3", startTime: 8,  endTime: 12, text: "ስንት ብር ነው?",                           translation: "How much birr is it?" },
      { id: "ta25-4", startTime: 12, endTime: 16, text: "ሃምሳ ብር ለሁለቱ።",                        translation: "Fifty birr for both." },
      { id: "ta25-5", startTime: 16, endTime: 20, text: "ውድ ነው! ሰላሳ ብር ልስጥዎ?",               translation: "That's expensive! Can I give you thirty birr?" },
      { id: "ta25-6", startTime: 20, endTime: 24, text: "አርባ ብር — ዋጋ ዝቅ ማድረግ አልችልም።",       translation: "Forty birr — I cannot lower the price more." },
      { id: "ta25-7", startTime: 24, endTime: 27, text: "እሺ! አርባ ብር ነው። ቅመሙ ጥሩ ነው።",        translation: "OK! It's forty birr. The spice is good." },
      { id: "ta25-8", startTime: 27, endTime: 30, text: "አመሰግናለሁ! ወደፊት ደግሞ እመጣለሁ።",         translation: "Thank you! I will come again in the future." },
    ],
  },
  {
    id: "lesson-26", courseId: "course-10", title: "Gathering for Timkat",
    description: "Maryam's family gathers for the Timkat festival — introducing family members.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 30, order: 3,
    transcript: [
      { id: "ta26-1", startTime: 0,  endTime: 4,  text: "ቤተሰቤ ለጥምቀት ተሰብስቧል።",                 translation: "My family has gathered for Timkat (Ethiopian Epiphany)." },
      { id: "ta26-2", startTime: 4,  endTime: 8,  text: "አባቴ ስሙ ተሰማ ነው። እርሱ ሐኪም ነው።",       translation: "My father's name is Tesema. He is a doctor." },
      { id: "ta26-3", startTime: 8,  endTime: 12, text: "እናቴ ስሟ አዜብ ናት። ምግብ ታበስላለች።",       translation: "My mother's name is Azeb. She cooks food." },
      { id: "ta26-4", startTime: 12, endTime: 16, text: "ወንድሜ ዮናስ ከጎንደር መጥቷል።",              translation: "My brother Yonas has come from Gondar." },
      { id: "ta26-5", startTime: 16, endTime: 20, text: "እህቴ ሔዋን ሁለት ልጆች አሏት።",             translation: "My sister Hewan has two children." },
      { id: "ta26-6", startTime: 20, endTime: 24, text: "አያቴ ዘጠና ዓመቱ ነው፣ ግን ጠንካራ ነው።",     translation: "My grandfather is ninety years old, but he is strong." },
      { id: "ta26-7", startTime: 24, endTime: 27, text: "ጥምቀት ቀን ወደ ቤተ ክርስቲያን ሄድን።",        translation: "On Timkat day we went to church." },
      { id: "ta26-8", startTime: 27, endTime: 30, text: "አብረን ምግብ በላን፣ ዘፈን፣ ጨፈርን።",         translation: "We ate food together, sang, and danced." },
    ],
  },
];
