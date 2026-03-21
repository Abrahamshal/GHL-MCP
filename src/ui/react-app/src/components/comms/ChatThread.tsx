import React, { useEffect, useRef } from 'react';
import type { ChatThreadProps, ChatMessage } from '../../types.js';

const chatTypeIcons: Record<string, string> = {
  sms: '💬',
  email: '📧',
  call: '📞',
  whatsapp: '📱',
};

const avatarColors = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

function getAvatarColor(name: string): string {
  return avatarColors[(name || '').charCodeAt(0) % avatarColors.length];
}

function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages = [],
  title,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on mount / messages change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <p>No messages</p>
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {title && (
        <div className="chat-thread-header">
          <h3 className="chat-thread-title">{title}</h3>
          <span className="chat-thread-count">{messages.length} messages</span>
        </div>
      )}
      <div className="chat-thread-body" ref={bodyRef}>
        {messages.map((msg: ChatMessage, i: number) => {
          const isOutbound = msg.direction === 'outbound';
          const typeIcon = chatTypeIcons[msg.type || 'sms'] || '💬';
          const avatarBg = isOutbound
            ? '#4f46e5'
            : getAvatarColor(msg.senderName || 'U');
          const initials = getInitials(
            msg.senderName || (isOutbound ? 'You' : 'Contact'),
          );

          return (
            <div
              key={i}
              className={`chat-msg ${isOutbound ? 'chat-msg-outbound' : 'chat-msg-inbound'}`}
            >
              {!isOutbound && (
                <div className="chat-avatar" style={{ background: avatarBg }}>
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      alt=""
                      className="chat-avatar-img"
                    />
                  ) : (
                    initials
                  )}
                </div>
              )}
              <div
                className={`chat-bubble-wrap ${isOutbound ? 'chat-bubble-wrap-right' : ''}`}
              >
                {msg.senderName && (
                  <div className="chat-sender">{msg.senderName}</div>
                )}
                <div
                  className={`chat-bubble ${isOutbound ? 'chat-bubble-outbound' : 'chat-bubble-inbound'}`}
                >
                  {msg.content}
                </div>
                <div className="chat-meta">
                  {typeIcon} {msg.timestamp || ''}
                </div>
              </div>
              {isOutbound && (
                <div
                  className="chat-avatar chat-avatar-outbound"
                  style={{ background: avatarBg }}
                >
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      alt=""
                      className="chat-avatar-img"
                    />
                  ) : (
                    initials
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
