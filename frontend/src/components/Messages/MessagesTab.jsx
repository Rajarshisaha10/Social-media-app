import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function MessagesTab({ initialPartnerId = null }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);

  // Load conversations list
  const loadConversations = async () => {
    if (!user?.user_id) return;
    try {
      const data = await api.getConversations(user.user_id);
      if (data?.conversations) {
        setConversations(data.conversations);
        // If initial partner given or default first
        if (initialPartnerId && !activePartner) {
          const matched = data.conversations.find((c) => c.partner_id === initialPartnerId);
          if (matched) selectConversation(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.user_id]);

  // Load thread when active partner changes
  const selectConversation = async (partner) => {
    setActivePartner(partner);
    setLoadingThread(true);
    try {
      const data = await api.getChatThread(user.user_id, partner.partner_id);
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 0ms Optimistic Message Sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner || !user?.user_id) return;

    const outgoingMsg = {
      message_id: `temp-${Date.now()}`,
      sender_id: user.user_id,
      receiver_id: activePartner.partner_id,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    // Instant append
    setMessages((prev) => [...prev, outgoingMsg]);
    setText('');

    // Update conversation snippet optimistically
    setConversations((prev) =>
      prev.map((c) =>
        c.partner_id === activePartner.partner_id
          ? { ...c, last_message: outgoingMsg.content, last_timestamp: outgoingMsg.created_at }
          : c
      )
    );

    try {
      await api.sendMessage({
        senderId: user.user_id,
        receiverId: activePartner.partner_id,
        content: outgoingMsg.content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className={`messages-container ${activePartner ? 'active-thread' : ''}`}>
      {/* Conversations Sidebar */}
      <div className="conversations-sidebar">
        <div className="conversations-header">
          <span>Direct Messages</span>
          <button
            type="button"
            className="btn-text-sm"
            onClick={loadConversations}
            title="Refresh"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="conversations-list">
          {loadingConvs ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: '13px' }}>No active conversations yet.</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.partner_id}
                type="button"
                className={`conversation-item ${activePartner?.partner_id === c.partner_id ? 'active' : ''}`}
                onClick={() => selectConversation(c)}
              >
                <img
                  src={c.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt={c.partner_username}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{c.partner_username}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.last_message || 'Tap to chat'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="chat-main">
        {activePartner ? (
          <>
            <div className="chat-header">
              <button
                type="button"
                className="btn-text-sm"
                onClick={() => setActivePartner(null)}
                style={{ display: 'none' }} // Visible on mobile via CSS
              >
                <ArrowLeft size={18} />
              </button>
              <img
                src={activePartner.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={activePartner.partner_username}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{activePartner.partner_username}</h4>
                <span style={{ fontSize: '11px', color: 'var(--green-accent)', fontWeight: 600 }}>Active now</span>
              </div>
            </div>

            <div className="chat-stream">
              {loadingThread ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="skeleton"
                      style={{
                        height: '42px',
                        width: '60%',
                        alignSelf: n % 2 === 0 ? 'flex-end' : 'flex-start',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                  <p>Send a message to start the conversation with {activePartner.partner_username}.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user?.user_id;
                  return (
                    <div
                      key={m.message_id}
                      className={`chat-bubble-row ${isMine ? 'sent' : 'received'}`}
                    >
                      <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                        {m.content}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="text"
                className="chat-input-text"
                placeholder="Write a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!text.trim()}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 12px', color: 'var(--blue-primary)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Your Conversations</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Select a chat or open a member's profile to start a direct message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
