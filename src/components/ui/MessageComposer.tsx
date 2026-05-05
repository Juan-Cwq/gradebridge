"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Mic,
  MicOff,
  X,
  Send,
  File,
  Image,
  FileText,
  Music,
  Video,
  Trash2,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

type MessageComposerProps = {
  placeholder?: string;
  onSend: (content: string, attachments: Attachment[]) => Promise<void>;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
  showSubject?: boolean;
  subjectValue?: string;
  onSubjectChange?: (value: string) => void;
  subjectPlaceholder?: string;
};

export function MessageComposer({
  placeholder = "Write your message...",
  onSend,
  disabled = false,
  minRows = 3,
  maxRows = 8,
  showSubject = false,
  subjectValue = "",
  onSubjectChange,
  subjectPlaceholder = "Subject",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("message-attachments")
        .upload(fileName, file);

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(data.path);

        newAttachments.push({
          id: data.path,
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (attachment: Attachment) => {
    await supabase.storage.from("message-attachments").remove([attachment.id]);
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const uploadRecording = async (): Promise<Attachment | null> => {
    if (!audioBlob) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileName = `${user.id}/${Date.now()}-recording.webm`;
    const { data, error } = await supabase.storage
      .from("message-attachments")
      .upload(fileName, audioBlob);

    if (error || !data) return null;

    const { data: urlData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(data.path);

    return {
      id: data.path,
      name: `Voice Recording (${formatTime(recordingTime)})`,
      type: "audio/webm",
      size: audioBlob.size,
      url: urlData.publicUrl,
    };
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0 && !audioBlob) return;

    setSending(true);
    let allAttachments = [...attachments];

    if (audioBlob) {
      const recordingAttachment = await uploadRecording();
      if (recordingAttachment) {
        allAttachments.push(recordingAttachment);
      }
    }

    try {
      await onSend(content.trim(), allAttachments);
      setContent("");
      setAttachments([]);
      cancelRecording();
    } catch (err) {
      console.error("Error sending message:", err);
    }

    setSending(false);
  };

  return (
    <div className="space-y-3">
      {showSubject && (
        <input
          type="text"
          value={subjectValue}
          onChange={(e) => onSubjectChange?.(e.target.value)}
          placeholder={subjectPlaceholder}
          className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary"
          disabled={disabled || sending}
        />
      )}

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          disabled={disabled || sending}
          className="w-full px-4 py-3 rounded-lg border border-base-300 bg-base-100 resize-none focus:outline-none focus:ring-2 focus:ring-secondary pr-24"
          style={{ maxHeight: `${maxRows * 1.5}rem` }}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || sending}
            className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors disabled:opacity-50"
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {!audioBlob && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || sending}
              className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors disabled:opacity-50"
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/30"
          >
            <div className="flex items-center gap-2 text-error">
              <span className="w-3 h-3 bg-error rounded-full animate-pulse" />
              <span className="font-medium">Recording</span>
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex-1" />
            <button
              onClick={stopRecording}
              className="p-2 rounded-lg bg-error text-white hover:bg-error/80"
              title="Stop recording"
            >
              <Square className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {audioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/30"
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={togglePlayback}
              className="p-2 rounded-lg bg-secondary text-white hover:bg-secondary/80"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-base-content">Voice Recording</p>
              <p className="text-xs text-base-content/50">{formatTime(recordingTime)}</p>
            </div>
            <button
              onClick={cancelRecording}
              className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-error"
              title="Remove recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 border border-base-300"
            >
              {getFileIcon(attachment.type)}
              <div className="max-w-[150px]">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-base-content/50">{formatFileSize(attachment.size)}</p>
              </div>
              <button
                onClick={() => removeAttachment(attachment)}
                className="p-1 rounded hover:bg-base-300 text-base-content/50 hover:text-error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <div className="loading loading-spinner loading-xs"></div>
          <span>Uploading files...</span>
        </div>
      )}

      {/* Send button */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={handleSend}
          disabled={disabled || sending || uploading || (!content.trim() && attachments.length === 0 && !audioBlob)}
          isLoading={sending}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}

// Component to display attachments in messages
export function AttachmentDisplay({ attachments }: { attachments: Attachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Attachments</p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <a
            key={index}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 border border-base-300 hover:border-secondary transition-colors"
          >
            {attachment.type.startsWith("image/") ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-10 h-10 object-cover rounded"
              />
            ) : attachment.type.startsWith("audio/") ? (
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-secondary" />
                <audio controls className="h-8 max-w-[200px]">
                  <source src={attachment.url} type={attachment.type} />
                </audio>
              </div>
            ) : (
              <>
                {getFileIcon(attachment.type)}
                <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
              </>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
