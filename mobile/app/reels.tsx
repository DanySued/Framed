import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useReelGenerationContext } from '@/lib/ReelGenerationContext';
import { apiFetch } from '@/lib/api';
import { API_BASE } from '@/lib/api';

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

// ── Keyword chip input ────────────────────────────────────────────────────────

function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (kw: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = (kw: string) => {
    const t = kw.trim().replace(',', '');
    if (t && !keywords.includes(t)) onChange([...keywords, t]);
    setInput('');
  };

  const remove = (kw: string) => onChange(keywords.filter((k) => k !== kw));

  const SUGGESTIONS = ['sunset aesthetic', 'city lights', 'golden hour', 'ocean vibes', 'adventure travel', 'minimalist'];

  return (
    <View className="bg-secondary rounded-xl p-4 border border-border">
      {/* Chips */}
      <View className="flex-row flex-wrap gap-1.5 mb-3 min-h-[32px]">
        {keywords.map((kw) => (
          <Pressable
            key={kw}
            onPress={() => remove(kw)}
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/20"
          >
            <Text className="text-xs text-primary">{kw}</Text>
            <Text className="text-xs text-primary/60">×</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type keyword + return…"
        placeholderTextColor="#71717a"
        returnKeyType="done"
        onSubmitEditing={() => add(input)}
        onBlur={() => add(input)}
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm mb-3"
      />

      <Text className="text-xs text-muted-foreground mb-2">Suggestions:</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {SUGGESTIONS.filter((s) => !keywords.includes(s)).slice(0, 4).map((s) => (
          <Pressable
            key={s}
            onPress={() => add(s)}
            className="px-2 py-0.5 rounded-full bg-secondary border border-border"
          >
            <Text className="text-xs text-muted-foreground">+ {s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const color =
    status === 'failed' ? '#ef4444' : status === 'done' ? '#10b981' : '#6366f1';
  const width = status === 'failed' || status === 'done' ? 100 : Math.max(progress, 2);
  return (
    <View className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <View style={{ width: `${width}%`, backgroundColor: color, height: '100%', borderRadius: 999 }} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [reelTitle, setReelTitle] = useState('Generated Reel');
  const [duration, setDuration] = useState(15);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

  const { jobs, isGenerating, error, startGeneration, approveClips, replaceClip, reset } =
    useReelGenerationContext();

  const isActive = jobs.length > 0 || isGenerating;
  const awaitingApprovalJobs = jobs.filter((j) => j.status === 'awaiting_clip_approval');
  const isAwaitingApproval = awaitingApprovalJobs.length > 0;
  const allSettled = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'failed');
  const doneJobs = jobs.filter((j) => j.status === 'done' && j.reel_id);

  useEffect(() => {
    const load = async () => {
      setIsLoadingAudio(true);
      setAudioError(null);
      try {
        const res = await apiFetch('/reels/audio');
        if (!res.ok) throw new Error('Failed to load audio');
        const data = await res.json();
        setAudioFiles(data.audio_files ?? []);
      } catch (err) {
        setAudioError(err instanceof Error ? err.message : 'Failed to load audio');
      } finally {
        setIsLoadingAudio(false);
      }
    };
    load();
  }, []);

  const handleUploadAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setIsUploading(true);
      setAudioError(null);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'audio/mpeg',
      } as any);

      const res = await apiFetch('/reels/upload-audio', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Upload failed');
      }
      const newAudio = await res.json();
      setAudioFiles((prev) => [newAudio, ...prev]);
      setSelectedAudioId(newAudio.id);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAudio = (audioId: string, filename: string) => {
    Alert.alert('Delete audio', `Remove "${filename}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiFetch(`/reels/audio/${audioId}`, { method: 'DELETE' });
          setAudioFiles((prev) => prev.filter((a) => a.id !== audioId));
          if (selectedAudioId === audioId) setSelectedAudioId('');
        },
      },
    ]);
  };

  const handleGenerate = async () => {
    if (!keywords.length) {
      setValidationError('Add at least one keyword');
      return;
    }
    if (!selectedAudioId) {
      setValidationError('Select or upload an audio track');
      return;
    }
    setValidationError(null);
    await startGeneration(1, keywords, selectedAudioId, duration, reelTitle, 0, { subtitlesEnabled });
  };

  const handleDownload = async (reelId: string) => {
    // On mobile, open the download URL in the browser / share sheet
    const url = `${API_BASE}/reels/download/${reelId}`;
    // expo-sharing or expo-file-system can be used here; for now just alert the URL
    Alert.alert('Reel ready', `Download URL:\n${url}`, [{ text: 'OK' }]);
  };

  // ── Form (idle state) ─────────────────────────────────────────────────────

  if (!isActive) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 gap-6">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-foreground">Create Reel</Text>
          <Pressable onPress={() => router.push('/settings')} className="p-2">
            <Text className="text-muted-foreground text-xs">⚙ Settings</Text>
          </Pressable>
        </View>

        {/* 1. Keywords */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">1. Keywords</Text>
          <KeywordInput keywords={keywords} onChange={setKeywords} />
        </View>

        {/* 2. Audio */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">2. Audio Track</Text>
          {audioError ? (
            <Text className="text-xs text-destructive mb-2">{audioError}</Text>
          ) : null}

          {isLoadingAudio ? (
            <ActivityIndicator color="#a855f7" />
          ) : (
            <View className="gap-2">
              {audioFiles.map((audio) => (
                <Pressable
                  key={audio.id}
                  onPress={() => setSelectedAudioId(audio.id)}
                  className={`flex-row items-center p-3.5 rounded-xl border ${
                    selectedAudioId === audio.id
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-secondary border-border'
                  }`}
                >
                  <Text className="text-base mr-3">🎵</Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {audio.filename}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{audio.duration}s</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteAudio(audio.id, audio.filename)}
                    className="p-1.5 ml-2"
                  >
                    <Text className="text-muted-foreground text-xs">🗑</Text>
                  </Pressable>
                </Pressable>
              ))}

              <Pressable
                onPress={handleUploadAudio}
                disabled={isUploading}
                className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary disabled:opacity-50"
              >
                {isUploading
                  ? <ActivityIndicator size="small" color="#a855f7" />
                  : <Text className="text-foreground text-sm">↑ Upload Audio</Text>
                }
              </Pressable>
            </View>
          )}
        </View>

        {/* 3. Settings */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">3. Settings</Text>
          <View className="bg-secondary/50 rounded-xl border border-border p-4 gap-4">
            <View>
              <Text className="text-xs text-muted-foreground mb-1">
                Duration: <Text className="text-foreground font-semibold">{duration}s</Text>
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {[5, 10, 15, 20, 30, 45, 60].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-semibold ${
                      duration === d
                        ? 'bg-primary/15 border-primary/40'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    <Text className={duration === d ? 'text-primary' : 'text-muted-foreground'}>
                      {d}s
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-3 border-t border-border">
              <View>
                <Text className="text-sm font-medium text-foreground">Auto Subtitles</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Transcribe audio and burn captions
                </Text>
              </View>
              <Pressable
                onPress={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`w-11 h-6 rounded-full ${subtitlesEnabled ? 'bg-sky-500' : 'bg-secondary border border-border'}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${subtitlesEnabled ? 'left-5' : 'left-0.5'}`}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {(validationError || error) ? (
          <Text className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            {validationError ?? error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating || !keywords.length || !selectedAudioId}
          className="w-full py-3.5 rounded-xl bg-primary items-center justify-center disabled:opacity-40"
        >
          <Text className="text-primary-foreground font-semibold">Generate Reel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Generating ─────────────────────────────────────────────────────────────

  if (isActive && !allSettled && !isAwaitingApproval) {
    const job = jobs[0];
    return (
      <View className="flex-1 bg-background items-center justify-center p-6 gap-5">
        <ActivityIndicator size="large" color="#a855f7" />
        <View className="items-center">
          <Text className="text-base font-semibold text-foreground">
            {job?.phase === 2 ? 'Rendering reel…' : 'Preparing clips…'}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            Phase {job?.phase ?? 1} of 2
          </Text>
        </View>
        {job && (
          <View className="w-full">
            <ProgressBar progress={job.phase_progress ?? job.progress} status={job.status} />
            <Text className="text-xs text-muted-foreground text-center mt-1">
              {Math.round(job.phase_progress ?? job.progress)}%
            </Text>
          </View>
        )}
        <Pressable onPress={reset} className="px-4 py-2 rounded-xl border border-border bg-secondary">
          <Text className="text-destructive text-sm">Stop</Text>
        </Pressable>
      </View>
    );
  }

  // ── Clip approval ──────────────────────────────────────────────────────────

  if (isAwaitingApproval) {
    const job = awaitingApprovalJobs[0];
    const clipCount = job.clip_count ?? 0;
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 gap-5">
        <View className="items-center">
          <Text className="text-base font-semibold text-foreground">Review your clips</Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {clipCount} clip{clipCount !== 1 ? 's' : ''} ready — approve to render
          </Text>
        </View>

        {Array.from({ length: clipCount }, (_, i) => (
          <View key={i} className="bg-secondary/50 rounded-xl border border-border p-3 gap-2">
            <Text className="text-sm font-medium text-foreground">Clip {i + 1}</Text>
            <Pressable
              onPress={() => replaceClip(job.job_id, i)}
              className="py-2 rounded-lg border border-border bg-secondary items-center"
            >
              <Text className="text-muted-foreground text-xs">Replace Clip</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() => approveClips(job.job_id)}
          className="w-full py-3.5 rounded-xl bg-primary items-center"
        >
          <Text className="text-primary-foreground font-semibold">Approve & Generate Reel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  if (allSettled) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6 gap-5">
        <Text className="text-4xl">🎬</Text>
        <Text className="text-base font-semibold text-foreground">
          {doneJobs.length} reel{doneJobs.length !== 1 ? 's' : ''} ready!
        </Text>

        {doneJobs.map((job, i) => (
          <Pressable
            key={job.job_id}
            onPress={() => handleDownload(job.reel_id!)}
            className="w-full py-3 rounded-xl bg-emerald-600 items-center"
          >
            <Text className="text-white font-semibold">
              ↓ Download{doneJobs.length > 1 ? ` Reel ${i + 1}` : ' Reel'}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={reset}
          className="w-full py-3 rounded-xl border border-border bg-secondary items-center"
        >
          <Text className="text-foreground font-semibold">Generate More</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}
