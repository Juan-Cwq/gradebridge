"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Megaphone,
  Trash2,
  Archive,
  Star,
  Mail,
  MailOpen,
  Send,
  Search,
  ArrowLeft,
  X,
  Check,
  PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MessageComposer, AttachmentDisplay, type Attachment } from "@/components/ui/MessageComposer";
import { createBrowserClient } from "@supabase/ssr";

type InboxItem = {
  id: string;
  type: "announcement" | "message";
  title: string;
  content: string;
  preview: string;
  sender: string;
  senderInitials: string;
  className: string;
  classColor: string | null;
  classId: string;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  originalId: string;
  recipientId?: string;
  attachments?: Attachment[];
};

type ClassTeacher = {
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string | null;
};

export default function StudentInboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "archived">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "messages" | "announcements">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<ClassTeacher | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        class:classes(
          id, name, color, teacher_id,
          teacher:profiles(id, full_name)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true);

    const teachers: ClassTeacher[] = [];
    const classIds: string[] = [];
    enrollments?.forEach((e) => {
      const cls = e.class as {
        id: string;
        name: string;
        color: string | null;
        teacher_id: string;
        teacher: { id: string; full_name: string | null } | null;
      } | null;
      if (cls) {
        classIds.push(cls.id);
        if (cls.teacher) {
          teachers.push({
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacher.id,
            teacherName: cls.teacher.full_name,
          });
        }
      }
    });
    setClassTeachers(teachers);

    const { data: inboxStatuses } = await supabase
      .from("inbox_items")
      .select("*")
      .eq("user_id", user.id);

    const statusMap = new Map(
      inboxStatuses?.map((s) => [`${s.item_type}-${s.item_id}`, s]) || []
    );

    const allItems: InboxItem[] = [];

    if (classIds.length > 0) {
      const { data: announcements } = await supabase
        .from("announcements")
        .select(`
          id, title, content, created_at, is_pinned, attachments,
          class:classes(id, name, color),
          teacher:profiles(full_name)
        `)
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      announcements?.forEach((a) => {
        const cls = a.class as { id: string; name: string; color: string | null } | null;
        const teacher = a.teacher as { full_name: string | null } | null;
        const status = statusMap.get(`announcement-${a.id}`);

        if (status?.is_deleted) return;

        allItems.push({
          id: `announcement-${a.id}`,
          type: "announcement",
          title: a.title,
          content: a.content,
          preview: a.content.slice(0, 100) + (a.content.length > 100 ? "..." : ""),
          sender: teacher?.full_name || "Teacher",
          senderInitials: teacher?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "T",
          className: cls?.name || "",
          classColor: cls?.color,
          classId: cls?.id || "",
          createdAt: a.created_at,
          isRead: status?.is_read || false,
          isStarred: status?.is_starred || false,
          isArchived: status?.is_archived || false,
          originalId: a.id,
          attachments: (a.attachments as Attachment[]) || [],
        });
      });
    }

    const { data: messages } = await supabase
      .from("messages")
      .select(`
        id, content, created_at, is_read, class_id, attachments,
        sender:profiles!messages_sender_id_fkey(id, full_name),
        class:classes(id, name, color)
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    messages?.forEach((m) => {
      const cls = m.class as { id: string; name: string; color: string | null } | null;
      const sender = m.sender as { id: string; full_name: string | null } | null;
      const status = statusMap.get(`message-${m.id}`);

      if (status?.is_deleted) return;

      allItems.push({
        id: `message-${m.id}`,
        type: "message",
        title: `Message from ${sender?.full_name || "Unknown"}`,
        content: m.content,
        preview: m.content.slice(0, 100) + (m.content.length > 100 ? "..." : ""),
        sender: sender?.full_name || "Unknown",
        senderInitials: sender?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?",
        className: cls?.name || "",
        classColor: cls?.color,
        classId: cls?.id || "",
        createdAt: m.created_at,
        isRead: status?.is_read ?? m.is_read ?? false,
        isStarred: status?.is_starred || false,
        isArchived: status?.is_archived || false,
        originalId: m.id,
        recipientId: sender?.id,
        attachments: (m.attachments as Attachment[]) || [],
      });
    });

    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(allItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const filteredItems = items.filter((item) => {
    if (filter === "unread" && item.isRead) return false;
    if (filter === "starred" && !item.isStarred) return false;
    if (filter === "archived" && !item.isArchived) return false;
    if (filter !== "archived" && item.isArchived) return false;
    if (typeFilter === "messages" && item.type !== "message") return false;
    if (typeFilter === "announcements" && item.type !== "announcement") return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.sender.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const updateItemStatus = async (
    itemId: string,
    updates: { is_read?: boolean; is_starred?: boolean; is_archived?: boolean; is_deleted?: boolean }
  ) => {
    if (!userId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const [itemType, originalId] = itemId.split("-");

    await supabase.from("inbox_items").upsert(
      {
        user_id: userId,
        item_type: itemType,
        item_id: originalId,
        ...updates,
      },
      { onConflict: "user_id,item_type,item_id" }
    );

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              isRead: updates.is_read ?? i.isRead,
              isStarred: updates.is_starred ?? i.isStarred,
              isArchived: updates.is_archived ?? i.isArchived,
            }
          : i
      ).filter((i) => !updates.is_deleted || i.id !== itemId)
    );

    if (updates.is_deleted && selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  const handleBulkAction = async (action: "read" | "unread" | "starred" | "archive" | "delete") => {
    for (const itemId of selectedItems) {
      switch (action) {
        case "read":
          await updateItemStatus(itemId, { is_read: true });
          break;
        case "unread":
          await updateItemStatus(itemId, { is_read: false });
          break;
        case "starred":
          const item = items.find((i) => i.id === itemId);
          await updateItemStatus(itemId, { is_starred: !item?.isStarred });
          break;
        case "archive":
          await updateItemStatus(itemId, { is_archived: true });
          break;
        case "delete":
          await updateItemStatus(itemId, { is_deleted: true });
          break;
      }
    }
    setSelectedItems(new Set());
  };

  const handleSelectItem = async (item: InboxItem) => {
    setSelectedItem(item);
    setShowReply(false);
    if (!item.isRead) {
      await updateItemStatus(item.id, { is_read: true });
    }
  };

  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (!userId || !selectedTeacher) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: selectedTeacher.teacherId,
      class_id: selectedTeacher.classId,
      content,
      attachments,
    });

    if (!error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      await supabase.from("notifications").insert({
        user_id: selectedTeacher.teacherId,
        type: "message",
        title: `New message from ${profile?.full_name || "a student"}`,
        message: `${selectedTeacher.className}: ${content.slice(0, 100)}`,
        link: "/teacher/messages",
      });

      setShowCompose(false);
      setSelectedTeacher(null);
      fetchData();
    }
  };

  const handleReply = async (content: string, attachments: Attachment[]) => {
    if (!selectedItem || !userId) return;

    const teacher = classTeachers.find((t) => t.classId === selectedItem.classId);
    if (!teacher) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: teacher.teacherId,
      class_id: selectedItem.classId,
      content,
      attachments,
    });

    if (!error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      await supabase.from("notifications").insert({
        user_id: teacher.teacherId,
        type: "message",
        title: `New message from ${profile?.full_name || "a student"}`,
        message: `${teacher.className}: ${content.slice(0, 100)}`,
        link: "/teacher/messages",
      });

      setShowReply(false);
      fetchData();
    }
  };

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-secondary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Inbox</h1>
          <p className="text-base-content/60">Messages and announcements from your classes</p>
        </div>
        <Button variant="secondary" onClick={() => setShowCompose(true)}>
          <PenSquare className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100%-60px)]">
        {/* Left panel - List */}
        <div className="w-full lg:w-2/5 flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-base-300 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inbox..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={selectAll}
                  className={`p-1.5 rounded hover:bg-base-200 ${
                    selectedItems.size === filteredItems.length && filteredItems.length > 0
                      ? "text-secondary"
                      : "text-base-content/50"
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>

                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={() => handleBulkAction("archive")}
                      className="p-1.5 rounded hover:bg-base-200 text-base-content/50 hover:text-base-content"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      className="p-1.5 rounded hover:bg-base-200 text-base-content/50 hover:text-error"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBulkAction("unread")}
                      className="p-1.5 rounded hover:bg-base-200 text-base-content/50 hover:text-base-content"
                      title="Mark as unread"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBulkAction("starred")}
                      className="p-1.5 rounded hover:bg-base-200 text-base-content/50 hover:text-warning"
                      title="Star"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-base-content/50 ml-2">
                      {selectedItems.size} selected
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="text-xs px-2 py-1 rounded border border-base-300 bg-base-100"
                >
                  <option value="all">All</option>
                  <option value="messages">Messages</option>
                  <option value="announcements">Announcements</option>
                </select>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="text-xs px-2 py-1 rounded border border-base-300 bg-base-100"
                >
                  <option value="all">Inbox</option>
                  <option value="unread">Unread</option>
                  <option value="starred">Starred</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Inbox className="w-12 h-12 text-base-content/20 mb-3" />
                <p className="text-base-content/50 text-sm">No items in your inbox</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 border-b border-base-200 cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? "bg-secondary/10"
                      : item.isRead
                      ? "bg-base-100 hover:bg-base-50"
                      : "bg-base-200/50 hover:bg-base-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="checkbox checkbox-sm checkbox-secondary mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => updateItemStatus(item.id, { is_starred: !item.isStarred })}
                    className={`mt-1 ${item.isStarred ? "text-warning" : "text-base-content/30 hover:text-warning"}`}
                  >
                    <Star className={`w-4 h-4 ${item.isStarred ? "fill-current" : ""}`} />
                  </button>
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          item.classColor || classColors[0]
                        }`}
                      >
                        {item.type === "announcement" ? (
                          <Megaphone className="w-4 h-4" />
                        ) : (
                          item.senderInitials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm truncate ${!item.isRead ? "font-semibold" : ""}`}>
                            {item.sender}
                          </span>
                          <span className="text-xs text-base-content/40">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!item.isRead ? "font-medium text-base-content" : "text-base-content/70"}`}>
                          {item.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-base-content/50 line-clamp-1 ml-10">
                      {item.preview}
                    </p>
                    <div className="flex items-center gap-2 mt-1 ml-10">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        item.type === "announcement"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}>
                        {item.type === "announcement" ? "Announcement" : "Message"}
                      </span>
                      <span className="text-xs text-base-content/40">{item.className}</span>
                      {item.attachments && item.attachments.length > 0 && (
                        <span className="text-xs text-base-content/40">📎 {item.attachments.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel - Detail view */}
        <div className="hidden lg:flex lg:w-3/5 flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden">
          {selectedItem ? (
            <>
              <div className="p-3 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateItemStatus(selectedItem.id, { is_archived: true })}
                    className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content"
                    title="Archive"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateItemStatus(selectedItem.id, { is_deleted: true })}
                    className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-error"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateItemStatus(selectedItem.id, { is_read: !selectedItem.isRead })}
                    className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-base-content"
                    title={selectedItem.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {selectedItem.isRead ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => updateItemStatus(selectedItem.id, { is_starred: !selectedItem.isStarred })}
                    className={`p-2 rounded-lg hover:bg-base-200 ${
                      selectedItem.isStarred ? "text-warning" : "text-base-content/50 hover:text-warning"
                    }`}
                    title={selectedItem.isStarred ? "Unstar" : "Star"}
                  >
                    <Star className={`w-5 h-5 ${selectedItem.isStarred ? "fill-current" : ""}`} />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-lg hover:bg-base-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    selectedItem.type === "announcement"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary"
                  }`}>
                    {selectedItem.type === "announcement" ? "Announcement" : "Message"}
                  </span>
                  <span className="text-xs text-base-content/50">{selectedItem.className}</span>
                </div>

                <h2 className="text-xl font-bold text-base-content mb-4">{selectedItem.title}</h2>

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      selectedItem.classColor || classColors[0]
                    }`}
                  >
                    {selectedItem.senderInitials}
                  </div>
                  <div>
                    <p className="font-medium text-base-content">{selectedItem.sender}</p>
                    <p className="text-sm text-base-content/50">
                      {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap mb-6">
                  {selectedItem.content}
                </div>

                {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                  <AttachmentDisplay attachments={selectedItem.attachments} />
                )}

                <div className="border-t border-base-300 pt-4 mt-6">
                  {showReply ? (
                    <div>
                      <p className="text-sm font-medium text-base-content mb-3">
                        Reply to {selectedItem.sender}
                      </p>
                      <MessageComposer
                        placeholder="Write your reply..."
                        onSend={handleReply}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowReply(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setShowReply(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Reply to {selectedItem.sender}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Inbox className="w-16 h-16 text-base-content/20 mb-4" />
              <h3 className="font-semibold text-base-content mb-2">Select a message</h3>
              <p className="text-sm text-base-content/50">
                Choose an item from the list to view its contents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-base-100 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-base-300 flex items-center justify-between">
                <h3 className="font-semibold text-lg">New Message</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-1 hover:bg-base-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    Send to
                  </label>
                  <select
                    value={selectedTeacher?.classId || ""}
                    onChange={(e) => {
                      const teacher = classTeachers.find((t) => t.classId === e.target.value);
                      setSelectedTeacher(teacher || null);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Select a teacher...</option>
                    {classTeachers.map((teacher) => (
                      <option key={teacher.classId} value={teacher.classId}>
                        {teacher.teacherName || "Teacher"} ({teacher.className})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeacher && (
                  <MessageComposer
                    placeholder="Write your message..."
                    onSend={handleSendMessage}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-base-100 z-50 flex flex-col"
          >
            <div className="p-3 border-b border-base-300 flex items-center gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg hover:bg-base-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center gap-1 justify-end">
                <button
                  onClick={() => updateItemStatus(selectedItem.id, { is_archived: true })}
                  className="p-2 rounded-lg hover:bg-base-200 text-base-content/50"
                >
                  <Archive className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateItemStatus(selectedItem.id, { is_deleted: true })}
                  className="p-2 rounded-lg hover:bg-base-200 text-base-content/50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateItemStatus(selectedItem.id, { is_starred: !selectedItem.isStarred })}
                  className={`p-2 rounded-lg hover:bg-base-200 ${selectedItem.isStarred ? "text-warning" : "text-base-content/50"}`}
                >
                  <Star className={`w-5 h-5 ${selectedItem.isStarred ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-xl font-bold text-base-content mb-2">{selectedItem.title}</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-base-content/50">{selectedItem.sender}</span>
                <span className="text-xs text-base-content/40">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap">
                {selectedItem.content}
              </div>
              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <AttachmentDisplay attachments={selectedItem.attachments} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
