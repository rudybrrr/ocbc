"use client";

import type { ChatAction, ChatMessage } from "@/lib/types";

export function ChatActionButton({
  action,
  onAction,
}: {
  action: ChatAction;
  onAction: (action: ChatAction) => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => onAction(action)}
    >
      {action.label}
    </button>
  );
}

export function FinancialEducationResponse({
  message,
  onAction,
  latest = false,
}: {
  message: ChatMessage;
  onAction: (action: ChatAction) => void;
  latest?: boolean;
}) {
  return (
    <article className="bubble assistant">
      <p>{message.text}</p>
      {message.actions && message.actions.length > 0 && (
        <div className="bubble-actions">
          {message.actions.map((action, index) => (
            <ChatActionButton
              key={`${action.type}-${index}`}
              action={action}
              onAction={onAction}
            />
          ))}
        </div>
      )}
      {latest && <span className="sr-only">Latest reply</span>}
    </article>
  );
}
