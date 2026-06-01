import { useState, useEffect } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
} from 'react-native'
import { usePreferences, useUpsertPreferences } from './hooks'
import type { Preferences, Tempo } from '@/types'
import { FR_GOLD } from '@/lib/theme'

const TEMPO_OPTIONS: { value: Tempo; label: string; desc: string }[] = [
  { value: 'slow',   label: 'Slow',   desc: '4–6s clips, calm pace' },
  { value: 'medium', label: 'Medium', desc: '2–4s clips, balanced' },
  { value: 'fast',   label: 'Fast',   desc: '1–2s clips, energetic' },
]

const MOOD_SUGGESTIONS = [
  'cinematic', 'dramatic', 'calm', 'uplifting',
  'dark', 'minimal', 'romantic', 'energetic',
]

const TAG_SUGGESTIONS = [
  'nature', 'city', 'people', 'architecture',
  'travel', 'ocean', 'forest', 'technology',
  'food', 'sport', 'abstract', 'aerial',
]

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

interface Props {
  onSaved?: () => void
}

export function PreferencesForm({ onSaved }: Props) {
  const { data: prefs, isLoading } = usePreferences()
  const upsert = useUpsertPreferences()

  const [tags, setTags] = useState<string[]>([])
  const [tempo, setTempo] = useState<Tempo>('medium')
  const [mood, setMood] = useState<string[]>([])
  const [clipDuration, setClipDuration] = useState(3.0)
  const [totalDuration, setTotalDuration] = useState(30)
  const [tagInput, setTagInput] = useState('')

  // Hydrate from fetched prefs
  useEffect(() => {
    if (prefs) {
      setTags(prefs.tags ?? [])
      setTempo(prefs.tempo ?? 'medium')
      setMood(prefs.mood ?? [])
      setClipDuration(prefs.clip_duration ?? 3.0)
      setTotalDuration(prefs.total_duration ?? 30)
    }
  }, [prefs])

  const toggleTag = (t: string) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const toggleMood = (m: string) =>
    setMood((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])

  const addTag = (t: string) => {
    const trimmed = t.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed])
    setTagInput('')
  }

  const clipDurationForTempo = (t: Tempo) => {
    if (t === 'slow') return 5.0
    if (t === 'fast') return 1.5
    return 3.0
  }

  const handleSave = async () => {
    await upsert.mutateAsync({ tags, tempo, mood, clip_duration: clipDuration, total_duration: totalDuration })
    onSaved?.()
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={FR_GOLD} />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 gap-5">

      {/* Tags */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-1">Visual tags</Text>
        <Text className="text-xs text-muted-foreground mb-3">
          Pexels will search for footage matching these keywords
        </Text>
        {/* Selected chips */}
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30"
            >
              <Text className="text-xs text-primary">{tag}</Text>
              <Text className="text-xs text-primary/60">×</Text>
            </Pressable>
          ))}
        </View>
        {/* Custom input */}
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          placeholder="Add your own tag…"
          placeholderTextColor="rgba(245,240,232,0.22)"
          returnKeyType="done"
          onSubmitEditing={() => addTag(tagInput)}
          className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm mb-3"
        />
        {/* Suggestions */}
        <View className="flex-row flex-wrap gap-1.5">
          {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
            <Pressable
              key={s}
              onPress={() => toggleTag(s)}
              className="px-2.5 py-1 rounded-full border border-border bg-secondary"
            >
              <Text className="text-xs text-muted-foreground">+ {s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tempo */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-3">Editing tempo</Text>
        <View className="gap-2">
          {TEMPO_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                setTempo(opt.value)
                setClipDuration(clipDurationForTempo(opt.value))
              }}
              className={`p-4 rounded-xl border ${
                tempo === opt.value
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-secondary border-border'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className={`text-sm font-semibold ${tempo === opt.value ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </Text>
                {tempo === opt.value && (
                  <View className="w-4 h-4 rounded-full bg-primary items-center justify-center">
                    <Text className="text-[8px] text-primary-foreground">✓</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-muted-foreground mt-0.5">{opt.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Mood */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-1">Mood</Text>
        <Text className="text-xs text-muted-foreground mb-3">
          Influences which clips are picked from search results
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {MOOD_SUGGESTIONS.map((m) => (
            <Pressable
              key={m}
              onPress={() => toggleMood(m)}
              className={`px-2.5 py-1 rounded-full border ${
                mood.includes(m)
                  ? 'bg-primary/15 border-primary/30'
                  : 'bg-secondary border-border'
              }`}
            >
              <Text className={`text-xs ${mood.includes(m) ? 'text-primary' : 'text-muted-foreground'}`}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Total duration */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-3">
          Target duration:{' '}
          <Text className="text-primary">{totalDuration}s</Text>
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setTotalDuration(d)}
              className={`px-3.5 py-1.5 rounded-xl border ${
                totalDuration === d
                  ? 'bg-primary/15 border-primary/40'
                  : 'bg-secondary border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${totalDuration === d ? 'text-primary' : 'text-muted-foreground'}`}>
                {d}s
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Save */}
      <Pressable
        onPress={handleSave}
        disabled={upsert.isPending}
        className="w-full py-3.5 rounded-xl bg-primary items-center disabled:opacity-40"
      >
        {upsert.isPending
          ? <ActivityIndicator color="#0a0800" />
          : <Text className="text-primary-foreground font-semibold">Save preferences</Text>
        }
      </Pressable>
    </ScrollView>
  )
}
