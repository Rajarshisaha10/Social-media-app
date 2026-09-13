// App State
let activeUserId = 1;
let usersCache = [];

// DOM Elements
const userSelect = document.getElementById("userSelect");
const currentUserAvatar = document.getElementById("currentUserAvatar");
const currentUserName = document.getElementById("currentUserName");
const postsList = document.getElementById("postsList");
const sidebarRecsList = document.getElementById("sidebarRecsList");
const fullRecsGrid = document.getElementById("fullRecsGrid");
const analyticsGrid = document.getElementById("analyticsGrid");
const usersGrid = document.getElementById("usersGrid");
const sidebarStats = document.getElementById("sidebarStats");
const recCountBadge = document.getElementById("recCountBadge");
const submitPostBtn = document.getElementById("submitPostBtn");
const postContent = document.getElementById("postContent");
const postUrl = document.getElementById("postUrl");
const refreshAnalyticsBtn = document.getElementById("refreshAnalyticsBtn");

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
    setupTabs();
    await loadUsers();
    await refreshFeed();
    await loadRecommendations();
    await loadAnalytics();

    // Event listeners
    userSelect.addEventListener("change", async (e) => {
        activeUserId = parseInt(e.target.value);
        updateActiveUserDisplay();
        await refreshFeed();
        await loadRecommendations();
    });

    submitPostBtn.addEventListener("click", handleCreatePost);
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener("click", loadAnalytics);
    }
});

// Setup Tab Navigation
function setupTabs() {
    const navButtons = document.querySelectorAll(".nav-btn[data-tab]");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const targetTab = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.classList.remove("active");
            });
            document.getElementById(targetTab).classList.add("active");

            if (targetTab === "analytics-tab") loadAnalytics();
            if (targetTab === "users-tab") renderUsersTab();
            if (targetTab === "recommendations-tab") loadRecommendations();
        });
    });
}

// Load Users from Backend
async function loadUsers() {
    try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
            usersCache = data.users;
            userSelect.innerHTML = usersCache.map(u => `
                <option value="${u.user_id}" ${u.user_id === activeUserId ? 'selected' : ''}>
                    ${u.username} (${u.admin_level || 'User'})
                </option>
            `).join("");

            updateActiveUserDisplay();
        }
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

// Update Active User in UI
function updateActiveUserDisplay() {
    const activeUser = usersCache.find(u => u.user_id === activeUserId);
    if (activeUser) {
        currentUserName.textContent = activeUser.username;
        currentUserAvatar.src = activeUser.profile_pic || "https://images.unsplash.com/photo-1494790108377-be9c29b29330";
    }
}

// Load Feed Posts
async function refreshFeed() {
    postsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading posts...</div>`;
    try {
        const res = await fetch("/api/posts");
        const data = await res.json();

        if (data.success && data.posts) {
            if (data.posts.length === 0) {
                postsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No posts yet. Be the first to share an update!</div>`;
                return;
            }

            postsList.innerHTML = data.posts.map(post => renderPostCard(post)).join("");
            attachPostEventListeners();
        }
    } catch (err) {
        postsList.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 1rem;">Failed to load feed.</div>`;
    }
}

// Render Single Post Card
function renderPostCard(post) {
    const avatar = post.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    const hasImage = post.url && (post.url.endsWith(".jpg") || post.url.endsWith(".png") || post.url.includes("unsplash") || post.url.includes("image"));
    const isLiked = post.reactions && post.reactions.some(r => r.user_id === activeUserId && r.reaction_type === 'LIKE');

    return `
        <div class="post-card" data-post-id="${post.post_id}">
            <div class="post-header">
                <div class="post-author">
                    <img class="avatar" src="${avatar}" alt="${post.username}">
                    <div>
                        <div class="author-name">${post.username}</div>
                        <div class="post-time">${post.created_date}</div>
                    </div>
                </div>
                <span class="badge badge-user">${post.visibility}</span>
            </div>

            <div class="post-content">${escapeHTML(post.content || '')}</div>

            ${hasImage ? `
                <div class="post-media-wrap">
                    <img class="post-media" src="${post.url}" alt="Media">
                </div>
            ` : (post.url ? `<p><a href="${post.url}" target="_blank" style="color: var(--accent); font-size: 0.9rem;">🔗 ${post.url}</a></p>` : '')}

            ${post.hashtags && post.hashtags.length > 0 ? `
                <div class="post-hashtags">
                    ${post.hashtags.map(h => `<span class="hashtag-badge">#${h}</span>`).join("")}
                </div>
            ` : ''}

            <div class="post-actions">
                <button class="action-btn react-btn ${isLiked ? 'reacted' : ''}" data-post-id="${post.post_id}">
                    👍 Like (${post.reaction_count || 0})
                </button>
                <button class="action-btn toggle-comment-btn" data-post-id="${post.post_id}">
                    💬 Comments (${post.comment_count || 0})
                </button>
            </div>

            <div class="comments-container">
                <div class="comments-list">
                    ${(post.comments || []).map(c => `
                        <div class="comment-item">
                            <img class="avatar-sm" src="${c.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="Avatar">
                            <div class="comment-bubble">
                                <div class="comment-author">${c.username}</div>
                                <div>${escapeHTML(c.content || '')}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                <form class="comment-form" data-post-id="${post.post_id}">
                    <input type="text" class="comment-input" placeholder="Write a comment..." required>
                    <button type="submit" class="btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">Reply</button>
                </form>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Post Elements
function attachPostEventListeners() {
    document.querySelectorAll(".react-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const postId = btn.getAttribute("data-post-id");
            try {
                const res = await fetch(`/api/posts/${postId}/react`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: activeUserId, reaction_type: "LIKE" })
                });
                if (res.ok) {
                    await refreshFeed();
                }
            } catch (err) {
                console.error("Error reacting to post:", err);
            }
        });
    });

    document.querySelectorAll(".comment-form").forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const postId = form.getAttribute("data-post-id");
            const input = form.querySelector(".comment-input");
            const content = input.value.trim();
            if (!content) return;

            try {
                const res = await fetch(`/api/posts/${postId}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: activeUserId, content: content })
                });
                if (res.ok) {
                    input.value = "";
                    await refreshFeed();
                }
            } catch (err) {
                console.error("Error posting comment:", err);
            }
        });
    });
}

// Create Post Handler
async function handleCreatePost() {
    const content = postContent.value.trim();
    const url = postUrl.value.trim();

    if (!content) {
        alert("Please write some content before publishing.");
        return;
    }

    submitPostBtn.disabled = true;
    submitPostBtn.textContent = "Posting...";

    try {
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: activeUserId,
                content: content,
                url: url || null,
                visibility: "PUBLIC"
            })
        });

        if (res.ok) {
            postContent.value = "";
            postUrl.value = "";
            await refreshFeed();
            await loadAnalytics();
        } else {
            alert("Failed to create post.");
        }
    } catch (err) {
        console.error("Error creating post:", err);
    } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.textContent = "Post Update";
    }
}

// Load Recommendations for Active User
async function loadRecommendations() {
    try {
        const res = await fetch(`/api/recommendations/${activeUserId}`);
        const data = await res.json();

        if (data.success && data.recommendations) {
            recCountBadge.textContent = data.count;

            if (data.recommendations.length === 0) {
                sidebarRecsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No new recommendations found.</p>`;
                fullRecsGrid.innerHTML = `<p style="color: var(--text-muted);">No recommendations available for this user.</p>`;
                return;
            }

            // Render Sidebar Widget
            sidebarRecsList.innerHTML = data.recommendations.slice(0, 3).map(rec => `
                <div class="rec-item">
                    <div class="rec-user">
                        <img class="avatar-sm" src="${rec.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="Pic">
                        <div>
                            <div style="font-weight: 600; font-size: 0.85rem;">${rec.Username}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${rec.Location || 'Global'}</div>
                        </div>
                    </div>
                    <span class="score-badge">${Math.round(rec.Score * 100)}% Match</span>
                </div>
            `).join("");

            // Render Full Recommendations Tab
            fullRecsGrid.innerHTML = data.recommendations.map(rec => `
                <div class="user-card">
                    <img class="avatar" src="${rec.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="Pic">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${rec.Username}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${rec.Location || 'Earth'}</p>
                    <span class="score-badge" style="font-size: 0.85rem; padding: 0.3rem 0.7rem; display: inline-block; margin-bottom: 0.8rem;">
                        ${Math.round(rec.Score * 100)}% Compatibility
                    </span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem;">${rec.Bio || ''}</p>
                    ${rec.Interests ? `<p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 1rem;">🎯 ${rec.Interests}</p>` : ''}
                    <button class="btn-primary" style="width: 100%;">Connect</button>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading recommendations:", err);
    }
}

// Load Analytics Overview
async function loadAnalytics() {
    try {
        const res = await fetch("/api/analytics/overview");
        const data = await res.json();

        if (data.success && data.analytics) {
            const a = data.analytics;

            const cards = [
                { title: "Total Users", count: a.totalUsers, icon: "👥" },
                { title: "Total Posts", count: a.totalPosts, icon: "📝" },
                { title: "Comments", count: a.totalComments, icon: "💬" },
                { title: "Reactions", count: a.totalReactions, icon: "❤️" },
                { title: "Direct Messages", count: a.totalMessages, icon: "✉️" },
                { title: "Communities", count: a.totalGroups, icon: "🌐" },
                { title: "Recommendations", count: a.totalRecommendations, icon: "🤝" },
                { title: "Notifications", count: a.totalNotifications, icon: "🔔" },
                { title: "Events Tracked", count: a.totalEvents, icon: "⚡" },
                { title: "Hashtags", count: a.totalHashtags, icon: "#️⃣" }
            ];

            analyticsGrid.innerHTML = cards.map(c => `
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>${c.title}</h3>
                        <div class="stat-number">${c.count}</div>
                    </div>
                    <div class="stat-icon">${c.icon}</div>
                </div>
            `).join("");

            // Sidebar summary
            sidebarStats.innerHTML = `
                <div style="display: flex; justify-content: space-between;"><span>Active Users:</span> <strong>${a.totalUsers}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Community Posts:</span> <strong>${a.totalPosts}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Engagement:</span> <strong>${a.totalReactions + a.totalComments} interactions</strong></div>
            `;
        }
    } catch (err) {
        console.error("Error loading analytics:", err);
    }
}

// Render Users Directory Tab
function renderUsersTab() {
    usersGrid.innerHTML = usersCache.map(u => `
        <div class="user-card">
            <img class="avatar" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${u.username}">
            <h3 style="font-size: 1.15rem; margin-bottom: 0.2rem;">${u.username}</h3>
            <span class="badge ${u.admin_level ? 'badge-admin' : 'badge-user'}">${u.admin_level || 'REGULAR USER'}</span>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.6rem;">${u.email}</p>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.6rem;">${u.bio || 'No bio provided.'}</p>
            ${u.interests ? `<p style="font-size: 0.8rem; color: var(--accent);">🎯 ${u.interests}</p>` : ''}
            ${u.location ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">📍 ${u.location}</p>` : ''}
        </div>
    `).join("");
}

// Utility: Escape HTML
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
