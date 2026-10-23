import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StoriesTray({ users = [], onSelectStory }) {
  const { user } = useAuth();

  // Normalize user objects whether from recommendations or posts
  const seen = new Set();
  const normalized = [];

  for (const u of users) {
    const userId = u.user_id || u.RecommendedUserID || u.id;
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);

    normalized.push({
      user_id: userId,
      username: u.username || u.Username || 'Engineer',
      profile_pic: u.profile_pic || u.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      bio: u.bio || u.Bio || '',
      interests: u.interests || u.Interests || '',
      story_snippet: u.story_snippet || (
        u.username === 'alex_chen' ? 'Benchmarking 2-hop traversals on Neo4j AuraDB: 4ms latency across 100k nodes! 🚀' :
        u.username === 'sarah_dev' ? 'Rust compiler internals: zero-cost async streams are pure magic 🦀' :
        u.username === 'kandarp' ? 'Distributed consensus with Raft in Go: partition tests passing! ⚡' :
        u.username === 'elena_ai' ? 'Fine-tuning quantized Llama 3 8B with LoRA on consumer RTX 4090 🧠' :
        u.username === 'marcus_k8s' ? 'Migrated 40 microservices to Cilium eBPF mesh without a second of downtime ☸️' :
        'Shipping high-performance systems and exploring graph database architecture!'
      )
    });
  }

  const storyUsers = normalized.slice(0, 10);

  return (
    <div className="stories-card">
      <div className="stories-row">
        {/* Current user story item */}
        {user && (
          <div
            className="story-bubble"
            onClick={() => onSelectStory({
              user_id: user.user_id,
              username: user.username,
              profile_pic: user.profile_pic,
              story_snippet: 'Working on Neo4j Graph DB live graph visualization demo! ✨',
            })}
            tabIndex={0}
            role="button"
            aria-label="Your Story"
          >
            <div className="story-ring" style={{ position: 'relative', borderColor: 'var(--blue-primary)' }}>
              <img
                className="story-avatar"
                src={user.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={user.username}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--blue-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                }}
              >
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <span className="story-label">Your Story</span>
          </div>
        )}

        {storyUsers.filter(u => u.user_id !== user?.user_id).map((u) => (
          <div
            key={u.user_id}
            className="story-bubble"
            onClick={() => onSelectStory(u)}
            tabIndex={0}
            role="button"
            aria-label={`View story from ${u.username}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectStory(u);
              }
            }}
          >
            <div className="story-ring">
              <img
                className="story-avatar"
                src={u.profile_pic}
                alt={u.username}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
                }}
              />
            </div>
            <span className="story-label">{u.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
