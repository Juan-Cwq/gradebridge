"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  X,
  Pin,
  Search,
  Calendar,
  Paperclip,
  Mic,
  Square,
  Play,
  Pause,
  Image,
  File,
  FileText,
  Music,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AttachmentDisplay, type Attachment } from "@/components/ui/MessageComposer";
import { createBrowserClient } from "@supabase/ssr";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean | null;
  class_id: string;
  attachments?: Attachment[];
  class: { id: string; name: string; color: string | null } | null;
};

type ClassData = {
  id: string;
  name: string;
  color: string | null;
};

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    class_id: "",
    is_pinned: false,
  });
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

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

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name, color")
      .eq("teacher_id", user.id)
      .eq("is_archived", false);

    setClasses(classesData || []);
    if (classesData && classesData.length > 0) {
      setFormData((prev) => ({ ...prev, class_id: classesData[0].id }));
    }

    const { data: announcementsData } = await supabase
      .from("announcements")
      .select(`
        id,
        title,
        content,
        created_at,
        is_pinned,
        class_id,
        attachments,
        class:classes(id, name, color)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    setAnnouncements(announcementsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || a.class_id === filterClass;
    return matchesSearch && matchesClass;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userId) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

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

    setFormAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (attachment: Attachment) => {
    await supabase.storage.from("message-attachments").remove([attachment.id]);
    setFormAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const uploadRecording = async (): Promise<Attachment | null> => {
    if (!audioBlob || !userId) return null;

    const fileName = `${userId}/${Date.now()}-recording.webm`;
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
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      class_id: classes[0]?.id || "",
      is_pinned: false,
    });
    setFormAttachments([]);
    cancelRecording();
    setShowNewForm(false);
    setEditingAnnouncement(null);
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.class_id || !userId) return;

    setSaving(true);
    let allAttachments = [...formAttachments];

    if (audioBlob) {
      const recordingAttachment = await uploadRecording();
      if (recordingAttachment) allAttachments.push(recordingAttachment);
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        teacher_id: userId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        class_id: formData.class_id,
        is_pinned: formData.is_pinned,
        attachments: allAttachments,
      })
      .select(`
        id, title, content, created_at, is_pinned, class_id, attachments,
        class:classes(id, name, color)
      `)
      .single();

    if (!error && announcement) {
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", formData.class_id)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const className = classes.find((c) => c.id === formData.class_id)?.name || "Class";

      if (enrollmentsData && enrollmentsData.length > 0) {
        const notifications = enrollmentsData.map((e) => ({
          user_id: e.user_id!,
          type: "announcement",
          title: `New Announcement: ${formData.title.trim()}`,
          message: `${className}: ${formData.content.trim().slice(0, 100)}${formData.content.length > 100 ? "..." : ""}`,
          link: "/student/inbox",
        }));

        await supabase.from("notifications").insert(notifications);
      }

      setAnnouncements([announcement, ...announcements]);
      resetForm();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement || !formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    let allAttachments = [...formAttachments];

    if (audioBlob) {
      const recordingAttachment = await uploadRecording();
      if (recordingAttachment) allAttachments.push(recordingAttachment);
    }

    const { error } = await supabase
      .from("announcements")
      .update({
        title: formData.title.trim(),
        content: formData.content.trim(),
        is_pinned: formData.is_pinned,
        attachments: allAttachments,
      })
      .eq("id", editingAnnouncement.id);

    if (!error) {
      setAnnouncements(
        announcements.map((a) =>
          a.id === editingAnnouncement.id
            ? { ...a, title: formData.title.trim(), content: formData.content.trim(), is_pinned: formData.is_pinned, attachments: allAttachments }
            : a
        )
      );
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (!error) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
      if (selectedAnnouncement?.id === id) setSelectedAnnouncement(null);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_pinned: !announcement.is_pinned })
      .eq("id", announcement.id);

    if (!error) {
      setAnnouncements(
        announcements.map((a) =>
          a.id === announcement.id ? { ...a, is_pinned: !a.is_pinned } : a
        )
      );
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      class_id: announcement.class_id,
      is_pinned: announcement.is_pinned || false,
    });
    setFormAttachments((announcement.attachments as Attachment[]) || []);
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Announcements</h1>
          <p className="text-base-content/60">Manage your class announcements</p>
        </div>
        <Button variant="primary" onClick={() => setShowNewForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-base-300 bg-base-100"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {(showNewForm || editingAnnouncement) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
                  </h3>
                  <button onClick={resetForm} className="p-1 hover:bg-base-200 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {!editingAnnouncement && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Class</label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title..."
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <div className="relative">
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your announcement..."
                      rows={6}
                      className="w-full px-4 py-2 pr-20 rounded-lg border border-base-300 bg-base-100 resize-none"
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
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
                        disabled={uploading}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content"
                        title="Attach files"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      {!audioBlob && !isRecording && (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content"
                          title="Record voice"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recording UI */}
                {isRecording && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/30">
                    <div className="flex items-center gap-2 text-error">
                      <span className="w-3 h-3 bg-error rounded-full animate-pulse" />
                      <span className="font-medium">Recording</span>
                      <span className="font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={stopRecording}
                      className="p-2 rounded-lg bg-error text-white hover:bg-error/80"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {audioUrl && !isRecording && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    <button onClick={togglePlayback} className="p-2 rounded-lg bg-primary text-white hover:bg-primary/80">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Voice Recording</p>
                      <p className="text-xs text-base-content/50">{formatTime(recordingTime)}</p>
                    </div>
                    <button onClick={cancelRecording} className="p-2 rounded-lg hover:bg-base-200 text-error">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Attachments preview */}
                {formAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formAttachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 border border-base-300">
                        {getFileIcon(att.type)}
                        <div className="max-w-[150px]">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-base-content/50">{formatFileSize(att.size)}</p>
                        </div>
                        <button onClick={() => removeAttachment(att)} className="p-1 rounded hover:bg-base-300 text-error">
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

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="text-sm">Pin this announcement</span>
                </label>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={editingAnnouncement ? handleUpdate : handleCreate}
                    disabled={!formData.title.trim() || !formData.content.trim() || uploading}
                    isLoading={saving}
                  >
                    {editingAnnouncement ? "Save Changes" : "Post Announcement"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No announcements</h3>
            <p className="text-sm text-base-content/60">
              {searchQuery || filterClass !== "all"
                ? "No announcements match your filters"
                : "Create your first announcement to communicate with students"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  announcement.is_pinned ? "border-primary/30" : ""
                }`}
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-2 h-full min-h-[60px] rounded-full ${
                        announcement.class?.color || classColors[index % classColors.length]
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-base-content/50">
                          {announcement.class?.name}
                        </span>
                        {announcement.is_pinned && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        {announcement.attachments && (announcement.attachments as Attachment[]).length > 0 && (
                          <span className="text-xs text-base-content/40">
                            📎 {(announcement.attachments as Attachment[]).length}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-base-content">{announcement.title}</h3>
                      <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-base-content/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(announcement.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePin(announcement)}
                        className={`p-2 rounded-lg hover:bg-base-200 transition-colors ${
                          announcement.is_pinned ? "text-primary" : "text-base-content/50"
                        }`}
                        title={announcement.is_pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(announcement)}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-error transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-base-100 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <span className="text-sm text-base-content/60">
                    {selectedAnnouncement.class?.name}
                  </span>
                  {selectedAnnouncement.is_pinned && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      startEdit(selectedAnnouncement);
                      setSelectedAnnouncement(null);
                    }}
                    className="p-2 rounded-lg hover:bg-base-200 text-base-content/50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-2 hover:bg-base-200 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h2 className="text-2xl font-bold text-base-content mb-2">
                  {selectedAnnouncement.title}
                </h2>
                <p className="text-sm text-base-content/50 mb-6">
                  Posted {new Date(selectedAnnouncement.created_at).toLocaleString()}
                </p>
                <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </div>
                {selectedAnnouncement.attachments && (selectedAnnouncement.attachments as Attachment[]).length > 0 && (
                  <AttachmentDisplay attachments={selectedAnnouncement.attachments as Attachment[]} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
