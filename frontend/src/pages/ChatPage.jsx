import { useEffect } from "react";
import { useWallpaper } from "../context/wallpaper";
import { useChatStore } from "../stores/useChatStore";
import ChatSidebar from "../components/chats/ChatSidebar";
import { ChatHeader } from "../components/chats/ChatHeader";
import { MessageList } from "../components/chats/MessageList";
import { ChatComposer } from "../components/chats/ChatComposer";
import { useSelectedConversation } from "../hooks/useSelectedConversation";


function ChatPage() {
  const { frameStyle } = useWallpaper();

  const getUsers = useChatStore((state) => state.getUsers);
  const getMessages = useChatStore((state) => state.getMessages);
  const getConversations = useChatStore((state) => state.getConversations);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useEffect(() => {
    getUsers();
    getConversations();
  }, [getConversations, getUsers]);

  useEffect(() => {
    if (!activeConversationId) return;

    getMessages(activeConversationId);
    subscribeToMessages(activeConversationId);

    return () => unsubscribeFromMessages();
  }, [getMessages, activeConversationId, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden p-2 sm:p-3 md:p-8" style={frameStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-border bg-background text-foreground">
        <ChatSidebar />

        <div
          className={`flex-1 flex-col overflow-hidden ${!isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
            }`}
        >
          <ChatHeader />
          <MessageList />

          {activeConversation ? <ChatComposer /> : null}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;