import React from 'react';

export default function StoriesTray({ users, onSelectStory }) {
  // Deduplicate users by user_id — 1 story bubble per person
  const seen = new Set();
  const uniqueUsers = [];
  for (const u of users) {
    if (!seen.has(u.user_id)) {
      seen.add(u.user_id);
      uniqueUsers.push(u);
    }
  }
  const storyUsers = uniqueUsers.slice(0, 10);

  return (
    <div className="stories-card">
      <div className="stories-row">
        {storyUsers.map((u) => (
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
                src={u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
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
