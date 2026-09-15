import React from 'react';

export default function StoriesTray({ users, onSelectStory }) {
  // Take users who have avatars as demo stories
  const storyUsers = users.slice(0, 10);

  return (
    <div className="stories-card">
      <div className="stories-row">
        {storyUsers.map((u) => (
          <div
            key={u.user_id}
            className="story-bubble"
            onClick={() => onSelectStory(u)}
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
