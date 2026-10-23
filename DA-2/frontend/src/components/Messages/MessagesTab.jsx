import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageSquare, RefreshCw, UserPlus } from 'lucide-react';
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
  const [allUsers, setAllUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations list
  const loadConversations = async () => {
    if (!user?.user_id) return;
    try {
      setLoadingConvs(true);
      const data = await api.getConversations(user.user_id);
      if (data?.conversations) {
        setConversations(data.conversations);
        
        // If initial partner given or select first conversation by default on desktop
        if (initialPartnerId) {
          const matched = data.conversations.find((c) => (c.partner_id || c.partner?.user_id) === initialPartnerId);
          if (matched) {
            selectConversation(matched);
          }
        } else if (!activePartner && data.conversations.length > 0 && window.innerWidth > 768) {
          selectConversation(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // Load available users for starting a new chat
  const loadUsers = async () => {
    try {
      const data = await api.getUsers(user?.user_id);
      if (data?.users) {
        setAllUsers(data.users.filter((u) => u.user_id !== user?.user_id));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadConversations();
      loadUsers();
    }
  }, [user?.user_id]);

  // Load thread when active partner changes
  const selectConversation = async (partner) => {
    const partnerId = partner.partner_id || partner.partner?.user_id || partner.user_id;
    const partnerUsername = partner.partner_username || partner.partner?.username || partner.username;
    const profilePic = partner.profile_pic || partner.partner?.profile_pic || partner.avatar_url;

    const normalizedPartner = {
      partner_id: partnerId,
      partner_username: partnerUsername,
      profile_pic: profilePic,
    };

    setActivePartner(normalizedPartner);
    setShowNewChat(false);
    setLoadingThread(true);
    try {
      const data = await api.getChatThread(user.user_id, partnerId);
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  // Poll for new incoming messages every 4 seconds when an active thread is open
  useEffect(() => {
    if (!activePartner?.partner_id || !user?.user_id) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getChatThread(user.user_id, activePartner.partner_id);
        if (data?.messages) {
          setMessages((prev) => {
            const pending = prev.filter((m) => String(m.message_id).startsWith('temp-'));
            const serverMsgIds = new Set(data.messages.map((m) => m.message_id));
            const unresolvedPending = pending.filter((m) => !serverMsgIds.has(m.message_id));
            return [...data.messages, ...unresolvedPending];
          });
        }
      } catch {
        // silent polling error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activePartner?.partner_id, user?.user_id]);

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
      sent_at: new Date().toISOString(),
    };

    // Instant append
    setMessages((prev) => [...prev, outgoingMsg]);
    const sentText = text.trim();
    setText('');

    // Update conversation snippet optimistically
    setConversations((prev) => {
      const exists = prev.some((c) => (c.partner_id || c.partner?.user_id) === activePartner.partner_id);
      if (exists) {
        return prev.map((c) =>
          (c.partner_id || c.partner?.user_id) === activePartner.partner_id
            ? { ...c, last_message: sentText, last_timestamp: outgoingMsg.sent_at }
            : c
        );
      } else {
        return [
          {
            partner_id: activePartner.partner_id,
            partner_username: activePartner.partner_username,
            profile_pic: activePartner.profile_pic,
            last_message: sentText,
            last_timestamp: outgoingMsg.sent_at,
            unread_count: 0,
          },
          ...prev,
        ];
      }
    });

    try {
      await api.sendMessage({
        senderId: user.user_id,
        receiverId: activePartner.partner_id,
        content: sentText,
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-text-sm"
              onClick={() => setShowNewChat(!showNewChat)}
              title="New Chat"
              style={{ color: showNewChat ? 'var(--blue-primary)' : 'var(--text-secondary)' }}
            >
              <UserPlus size={16} />
            </button>
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
        </div>

        {/* New Chat User Selector */}
        {showNewChat && (
          <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Start conversation with:
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {allUsers.map((u) => (
                <button
                  key={u.user_id}
                  type="button"
                  onClick={() => selectConversation(u)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                >
                  <img
                    src={u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                    alt={u.username}
                    style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="conversations-list">
          {loadingConvs ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-convo-row">
                  <div className="skeleton skeleton-avatar" style={{ width: 42, height: 42 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton skeleton-bar" style={{ width: 110, height: 13 }} />
                    <div className="skeleton skeleton-bar" style={{ width: 160, height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <MessageSquare size={22} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No messages yet — start a conversation</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '240px', lineHeight: '1.45' }}>
                Direct message any member to discuss projects, ideas, or collaborate.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowNewChat(true)}
                style={{ marginTop: '8px', fontSize: '12.5px', padding: '7px 16px' }}
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            conversations.map((c) => {
              const partnerId = c.partner_id || c.partner?.user_id;
              const partnerUsername = c.partner_username || c.partner?.username;
              const profilePic = c.profile_pic || c.partner?.profile_pic;
              const lastMsgText = typeof c.last_message === 'string' ? c.last_message : (c.last_message?.content || 'Tap to chat');

              return (
                <button
                  key={partnerId}
                  type="button"
                  className={`conversation-item ${activePartner?.partner_id === partnerId ? 'active' : ''}`}
                  onClick={() => selectConversation(c)}
                  aria-label={`Chat with ${partnerUsername}`}
                >
                  <img
                    src={profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                    alt={partnerUsername}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{partnerUsername}</span>
                      {c.unread_count > 0 && (
                        <span style={{
                          background: 'var(--blue-primary)',
                          color: '#fff',
                          borderRadius: '10px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lastMsgText}
                    </div>
                  </div>
                </button>
              );
            })
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
                className="btn-text-sm chat-back-btn"
                onClick={() => setActivePartner(null)}
                title="Back to conversations"
                aria-label="Back to conversations"
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      style={{
                        alignSelf: n % 2 === 0 ? 'flex-end' : 'flex-start',
                        width: n === 1 ? '55%' : n === 2 ? '42%' : '65%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          borderBottomRightRadius: n % 2 === 0 ? '4px' : 'var(--radius-md)',
                          borderBottomLeftRadius: n % 2 !== 0 ? '4px' : 'var(--radius-md)',
                        }}
                      />
                      <div className="skeleton skeleton-bar" style={{ width: 40, height: 8, alignSelf: n % 2 === 0 ? 'flex-end' : 'flex-start' }} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Say hello to {activePartner.partner_username}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.45' }}>
                    Kick off your thread with a quick introduction or collaboration question.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user?.user_id;
                  const timeStr = m.created_at || m.sent_at;
                  return (
                    <div
                      key={m.message_id}
                      className={`chat-bubble-row ${isMine ? 'sent' : 'received'}`}
                    >
                      <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                        {m.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', padding: '0 4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{timeStr ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        {isMine && (
                          <span style={{ color: 'var(--blue-primary)', fontWeight: 700, fontSize: '11px', letterSpacing: '-1px' }} title="Delivered">
                            ✓✓
                          </span>
                        )}
                      </div>
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
                aria-label="Write a message"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!text.trim()}
                title="Send message"
                aria-label="Send message"
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <MessageSquare size={26} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Your Direct Messages</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.45' }}>
              Select an existing chat from the left or click "New Chat" to message any member in the community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
