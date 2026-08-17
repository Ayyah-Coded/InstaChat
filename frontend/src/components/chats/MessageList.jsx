import { Fragment } from "react";
import { MessageBubble } from "./MessageBubble";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { formatMessageDate, isSameDay } from "../../lib/utils";

export function MessageList() {
  const { activeConversation, activeConversationId } = useSelectedConversation();

  const lastMessageId = activeConversation?.messages.at(-1)?.id;
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <div
          ref={messagesScrollRef}
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
        >
          {activeConversation.messages.map((message, index) => {
            const previousMessage = activeConversation.messages[index - 1];
            const showDateSeparator =
              index === 0 ||
              !previousMessage?.createdAt ||
              !isSameDay(message.createdAt, previousMessage.createdAt);

            return (
              <Fragment key={message.id}>
                {showDateSeparator ? (
                  <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
                    {formatMessageDate(message.createdAt)}
                  </p>
                ) : null}
                <MessageBubble message={message} />
              </Fragment>
            );
          })}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
};