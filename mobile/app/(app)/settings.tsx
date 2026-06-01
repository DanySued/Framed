import { View, Text, Pressable, ScrollView } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function SettingsScreen() {
  const { session } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-5">
      <View className="bg-card rounded-2xl p-5 border border-border gap-4">
        <View>
          <Text className="text-xs text-muted-foreground mb-1">Signed in as</Text>
          <Text className="text-sm text-foreground">{session?.user.email}</Text>
        </View>
        <Pressable
          onPress={handleSignOut}
          className="py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 items-center"
        >
          <Text className="text-destructive text-sm font-medium">Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
