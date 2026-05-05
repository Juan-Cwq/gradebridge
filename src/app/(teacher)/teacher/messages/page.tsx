"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Inbox,
  Megaphone,
  Plus,
  X,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Image,
  File,
  FileText,
  Music,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageComposer, AttachmentDisplay, type Attachment } from "@/components/ui/MessageComposer";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  class_id: string;
  subject: string | null;
  content: string;
  is_read: boolean | null;
  created_at: string;
  attachments?: Attachment[];
  sender?: { full_name: string | null };
  recipient?: { full_name: string | null };
};

type StudentConvo = {
  id: string;
  name: string;
  classId: string;
  className: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
};

type ClassData = {
  id: string;
  name: string;
  color: string | null;
};

type EnrolledStudent = {
  id: string;
  full_name: string | null;
  classId: string;
  className: string;
};

export default function TeacherMessagesPage() {
  const searchParams = useSearchParams();
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [conversations, setConversations] = useState<StudentConvo[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<StudentConvo | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [announcementClass, setAnnouncementClass] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [newMessageStudent, setNewMessageStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      setAnnouncementClass(classesData[0].id);
    }

    const classIds = (classesData || []).map((c) => c.id);
    if (classIds.length > 0) {
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select(`
          class_id,
          user:profiles!enrollments_user_id_fkey(id, full_name),
          class:classes(name)
        `)
        .in("class_id", classIds)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const students: EnrolledStudent[] = (enrollmentsData || [])
        .map((e) => {
          const student = e.user as { id: string; full_name: string | null } | null;
          const cls = e.class as { name: string } | null;
          if (!student) return null;
          return {
            id: student.id,
            full_name: student.full_name,
            classId: e.class_id,
            className: cls?.name || "Unknown",
          };
        })
        .filter((s): s is EnrolledStudent => s !== null);

      setEnrolledStudents(students);
      if (students.length > 0) {
        setNewMessageStudent(`${students[0].id}|${students[0].classId}`);
      }
    }

    const { data: messagesData } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name),
        recipient:profiles!messages_recipient_id_fkey(id, full_name),
        class:classes(id, name)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const convoMap = new Map<string, StudentConvo>();
    messagesData?.forEach((msg) => {
      const studentId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      const studentName = msg.sender_id === user.id 
        ? (msg.recipient as { full_name: string | null })?.full_name 
        : (msg.sender as { full_name: string | null })?.full_name;
      const cls = msg.class as { id: string; name: string } | null;

      const key = `${studentId}-${msg.class_id}`;
      if (!convoMap.has(key)) {
        convoMap.set(key, {
          id: studentId,
          name: studentName || "Unknown Student",
          classId: msg.class_id,
          className: cls?.name || "Unknown Class",
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        });
      }

      if (!msg.is_read && msg.recipient_id === user.id) {
        const convo = convoMap.get(key)!;
        convo.unreadCount++;
      }
    });

    setConversations(Array.from(convoMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!selectedConvo || !userId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          recipient:profiles!messages_recipient_id_fkey(full_name)
        `)
        .eq("class_id", selectedConvo.classId)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${selectedConvo.id}),and(sender_id.eq.${selectedConvo.id},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("recipient_id", userId)
        .eq("sender_id", selectedConvo.id)
        .eq("class_id", selectedConvo.classId);
    };

    fetchMessages();

    const channel = supabase
      .channel(`teacher-messages-${selectedConvo.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === userId && newMsg.recipient_id === selectedConvo.id) ||
            (newMsg.sender_id === selectedConvo.id && newMsg.recipient_id === userId)
          ) {
            const { data } = await supabase
              .from("messages")
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(full_name),
                recipient:profiles!messages_recipient_id_fkey(full_name)
              `)
              .eq("id", newMsg.id)
              .single();
            
            if (data) {
              setMessages((prev) => [...prev, data]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvo, userId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (!selectedConvo || !userId) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: selectedConvo.id,
      class_id: selectedConvo.classId,
      content,
      attachments,
    });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: selectedConvo.id,
        type: "message",
        title: "New message from teacher",
        message: `${selectedConvo.className}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
        link: "/student/inbox",
      });
    }
  };

  const handleSendNewMessage = async (content: string, attachments: Attachment[]) => {
    if (!newMessageStudent || !userId) return;

    const [studentId, classId] = newMessageStudent.split("|");
    
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: studentId,
      class_id: classId,
      content,
      attachments,
    });

    if (!error) {
      const student = enrolledStudents.find((s) => s.id === studentId && s.classId === classId);
      if (student) {
        await supabase.from("notifications").insert({
          user_id: studentId,
          type: "message",
          title: "New message from teacher",
          message: `${student.className}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
          link: "/student/inbox",
        });

        const newConvo: StudentConvo = {
          id: studentId,
          name: student.full_name || "Unknown",
          classId: classId,
          className: student.className,
          lastMessage: content,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
        
        const existingIndex = conversations.findIndex(
          (c) => c.id === studentId && c.classId === classId
        );
        
        if (existingIndex === -1) {
          setConversations([newConvo, ...conversations]);
        }
        
        setSelectedConvo(newConvo);
      }
      
      setShowNewMessage(false);
    }
  };

  const handlePostAnnouncement = async (content: string, attachments: Attachment[]) => {
    if (!announcementTitle.trim() || !announcementClass || !userId) return;

    const { error, data: announcement } = await supabase.from("announcements").insert({
      class_id: announcementClass,
      teacher_id: userId,
      title: announcementTitle.trim(),
      content,
      attachments,
    }).select().single();

    if (!error && announcement) {
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", announcementClass)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const className = classes.find((c) => c.id === announcementClass)?.name || "Class";

      if (enrollmentsData && enrollmentsData.length > 0) {
        const notifications = enrollmentsData.map((e) => ({
          user_id: e.user_id!,
          type: "announcement",
          title: `New Announcement: ${announcementTitle.trim()}`,
          message: `${className}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
          link: "/student/inbox",
        }));

        await supabase.from("notifications").insert(notifications);
      }

      setAnnouncementTitle("");
      setShowAnnouncement(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Messages</h1>
          <p className="text-base-content/60">Communicate with students and post announcements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewMessage(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
          <Button variant="primary" onClick={() => setShowAnnouncement(true)}>
            <Megaphone className="w-4 h-4 mr-2" />
            Post Announcement
          </Button>
        </div>
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewMessage(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-base-100 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-base-300 flex items-center justify-between sticky top-0 bg-base-100">
                <h2 className="text-lg font-semibold">New Message</h2>
                <button onClick={() => setShowNewMessage(false)} className="p-1 hover:bg-base-200 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <select
                    value={newMessageStudent}
                    onChange={(e) => setNewMessageStudent(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {enrolledStudents.map((student) => (
                      <option key={`${student.id}-${student.classId}`} value={`${student.id}|${student.classId}`}>
                        {student.full_name || "Unknown"} ({student.className})
                      </option>
                    ))}
                  </select>
                </div>
                <MessageComposer
                  placeholder="Write your message..."
                  onSend={handleSendNewMessage}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Announcement Modal */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAnnouncement(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-base-100 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-base-300 flex items-center justify-between sticky top-0 bg-base-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Post Announcement</h2>
                </div>
                <button onClick={() => setShowAnnouncement(false)} className="p-1 hover:bg-base-200 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class</label>
                  <select
                    value={announcementClass}
                    onChange={(e) => setAnnouncementClass(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <MessageComposer
                  placeholder="Write your announcement..."
                  onSend={handlePostAnnouncement}
                  disabled={!announcementTitle.trim()}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
        <div className="lg:col-span-1 space-y-2 overflow-y-auto">
          <h3 className="font-semibold text-sm text-base-content/70 mb-3">Conversations</h3>
          {conversations.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-base-content/50 mb-2">No messages yet</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewMessage(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Start a conversation
              </Button>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={`${convo.id}-${convo.classId}`}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedConvo?.id === convo.id && selectedConvo?.classId === convo.classId
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-base-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {convo.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-base-content text-sm truncate">
                        {convo.name}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-content text-xs">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/50 truncate">
                      {convo.className}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {selectedConvo ? (
              <>
                <CardHeader className="border-b border-base-300 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                      {selectedConvo.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-base-content">
                        {selectedConvo.name}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {selectedConvo.className}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Inbox className="w-12 h-12 text-base-content/20 mb-3" />
                      <p className="text-base-content/50 text-sm">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === userId;
                      const attachments = (message.attachments as Attachment[]) || [];
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? "bg-primary text-primary-content"
                                : "bg-base-200 text-base-content"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {attachments.map((att, i) => (
                                  <a
                                    key={i}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 text-xs p-2 rounded ${
                                      isOwnMessage ? "bg-primary-content/10" : "bg-base-300"
                                    }`}
                                  >
                                    {att.type.startsWith("audio/") ? (
                                      <audio controls className="h-8 max-w-[180px]">
                                        <source src={att.url} type={att.type} />
                                      </audio>
                                    ) : att.type.startsWith("image/") ? (
                                      <img src={att.url} alt={att.name} className="max-w-[200px] rounded" />
                                    ) : (
                                      <>
                                        {getFileIcon(att.type)}
                                        <span className="truncate">{att.name}</span>
                                      </>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                            
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? "text-primary-content/70" : "text-base-content/50"
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-base-300">
                  <MessageComposer
                    placeholder="Type a message..."
                    onSend={handleSendMessage}
                    minRows={1}
                    maxRows={4}
                  />
                </div>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                  <p className="text-base-content/50 mb-4">
                    Select a conversation or start a new one
                  </p>
                  <Button variant="outline" onClick={() => setShowNewMessage(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
