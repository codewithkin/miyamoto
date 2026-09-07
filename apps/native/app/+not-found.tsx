import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { Enter } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { indigo, space } from "@/theme/tokens";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost" }} />
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: space.base }}>
          <Enter preset="rise">
            <Text variant="display">You have wandered off the path.</Text>
          </Enter>
          <Enter preset="fade" delay={200}>
            <Link href="/(app)">
              <Text variant="label" color={indigo.light}>
                Back to today&apos;s trial
              </Text>
            </Link>
          </Enter>
        </View>
      </Screen>
    </>
  );
}
