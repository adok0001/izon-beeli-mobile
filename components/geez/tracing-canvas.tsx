import { useRef, useState } from "react";
import { View, Text, Pressable, PanResponder } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import type { GeezCharacter } from "@/lib/data/geez";
import { hapticTap } from "@/lib/haptics";

const CANVAS_SIZE = 300;

interface TracingCanvasProps {
  character: GeezCharacter;
}

export function TracingCanvas({ character }: TracingCanvasProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        hapticTap();
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M${locationX},${locationY}`;
        setPaths((prev) => [...prev, currentPath.current]);
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L${locationX},${locationY}`;
        setPaths((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = currentPath.current;
          return updated;
        });
      },

      onPanResponderRelease: () => {
        currentPath.current = "";
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    currentPath.current = "";
  };

  return (
    <View className="items-center">
      <View
        className="overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        {...panResponder.panHandlers}
      >
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
          {/* Guide character underneath */}
          <SvgText
            x={CANVAS_SIZE / 2}
            y={CANVAS_SIZE / 2 + 60}
            fontSize={200}
            textAnchor="middle"
            fill="#d1d5db"
            opacity={0.3}
          >
            {character.character}
          </SvgText>

          {/* User-drawn paths */}
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke="#3b82f6"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>

      {/* Character label */}
      <Text className="mt-3 text-base text-neutral-600 dark:text-neutral-300">
        Trace: <Text className="text-2xl font-bold">{character.character}</Text>{" "}
        ({character.romanization})
      </Text>

      {/* Clear button */}
      <Pressable
        onPress={handleClear}
        className="mt-4 rounded-xl border-2 border-neutral-200 px-8 py-3 active:opacity-80 dark:border-neutral-700"
      >
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Clear
        </Text>
      </Pressable>
    </View>
  );
}
