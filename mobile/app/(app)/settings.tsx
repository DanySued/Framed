import { View, Text, Pressable, ScrollView } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { PreferencesForm } from '@/features/preferences/PreferencesForm'

export default function SettingsScreen() {
  const { session } = useAuth()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-8">
      {/* Account section */}
      <View className="px-5 py-4 border-b border-border">
        <Text className="text-xs text-muted-foreground mb-1">Signed in as</Text>
        <Text className="text-sm text-foreground mb-3">{session?.user.email}</Text>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 items-center"
        >
          <Text className="text-destructive text-sm font-medium">Sign out</Text>
        </Pressable>
      </View>

      {/* Preferences */}
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
