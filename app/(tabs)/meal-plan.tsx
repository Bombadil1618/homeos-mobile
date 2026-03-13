import { FlatList, Text, View } from "react-native";

// Placeholder: use FlatList for all list screens (required for RN performance).
// Later this will show meal plan days/entries from API; data hooks in parent Next.js project:
// src/modules/meal-plan (when built), calendar + family/pantry for context
const PLACEHOLDER_DATA: { id: string }[] = [];

export default function MealPlanScreen() {
  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={PLACEHOLDER_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <Text className="text-gray-900">{item.id}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-xl font-bold text-gray-900">Meal Plan</Text>
          </View>
        }
      />
    </View>
  );
}
