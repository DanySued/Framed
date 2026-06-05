import { View, Text, ScrollView } from 'react-native'
import { PreferencesForm } from '@/features/preferences/PreferencesForm'

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-8">
      <View className="px-5 pt-5">
        <Text className="text-base font-semibold text-foreground mb-1">Preferences</Text>
        <Text className="text-xs text-muted-foreground mb-4">
          Used for auto-compiling a timeline from Pexels footage
        </Text>
      </View>
      <PreferencesForm />
    </ScrollView>
  )
}
