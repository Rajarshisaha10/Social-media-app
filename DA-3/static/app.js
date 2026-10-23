/**
 * SocialSphere — Instagram Web & Mobile PWA Application Logic
 * Features:
 * - Mandatory Authentication Gate (Login Screen First)
 * - Persistent Login Session Caching (localStorage)
 * - Follow / Unfollow Social Graph System
 * - Super Admin (rajarshi) Privacy & Restricted SQL Studio
 * - PWA Service Worker Offline Caching & "Add to Home Screen"
 * - Dynamic Feed with Likes, Comments, Hashtag Filters
 * - Real-time Direct Messaging, Communities, and Stories
 */

// Global Application State
let activeAuthUser = null;
let activeUserId = null;
let activeUserObj = null;
let usersCache = [];
let activeChatPartnerId = null;
let currentTagFilter = null;
let lastSqlResults = null;
let deferredPwaPrompt = null;
let followingSet = new Set(); // Set of user_ids that activeUserId follows

// DOM Selectors
const authGateOverlay = document.getElementById("authGateOverlay");
const appLayoutSection = document.getElementById("appLayoutSection");
const mobileBottomNav = document.getElementById("mobileBottomNav");

// Auth Form Elements
const tabBtnLogin = document.getElementById("tabBtnLogin");
const tabBtnRegister = document.getElementById("tabBtnRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const submitLoginBtn = document.getElementById("submitLoginBtn");
const loginErrorMsg = document.getElementById("loginErrorMsg");

const regUsername = document.getElementById("regUsername");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regBio = document.getElementById("regBio");
const regLocation = document.getElementById("regLocation");
const regInterests = document.getElementById("regInterests");
const submitRegisterBtn = document.getElementById("submitRegisterBtn");
const registerErrorMsg = document.getElementById("registerErrorMsg");

// User Header & Sidebar Elements
const headerUserAvatar = document.getElementById("headerUserAvatar");
const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarAdminBadge = document.getElementById("sidebarAdminBadge");
const sidebarUserRoleDesc = document.getElementById("sidebarUserRoleDesc");
const sidebarSelfName = document.getElementById("sidebarSelfName");
const sidebarSelfRole = document.getElementById("sidebarSelfRole");
const currentUserAvatar = document.getElementById("currentUserAvatar");
const currentUserName = document.getElementById("currentUserName");
const feedAdminBadge = document.getElementById("feedAdminBadge");
const mobileUserAvatar = document.getElementById("mobileUserAvatar");
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

// Feed Elements
const storiesTrayList = document.getElementById("storiesTrayList");
const postsList = document.getElementById("postsList");
const postContent = document.getElementById("postContent");
const postUrl = document.getElementById("postUrl");
const createPostPreviewBox = document.getElementById("createPostPreviewBox");
const createPostPreviewImg = document.getElementById("createPostPreviewImg");
const removePreviewImgBtn = document.getElementById("removePreviewImgBtn");
const submitPostBtn = document.getElementById("submitPostBtn");

const feedHashtagsList = document.getElementById("feedHashtagsList");
const clearHashtagFilter = document.getElementById("clearHashtagFilter");
const activeFilterBanner = document.getElementById("activeFilterBanner");
const filterTagName = document.getElementById("filterTagName");
const removeFilterBtn = document.getElementById("removeFilterBtn");

// PWA Elements
const pwaInstallBanner = document.getElementById("pwaInstallBanner");
const pwaInstallActionBtn = document.getElementById("pwaInstallActionBtn");
const pwaDismissBtn = document.getElementById("pwaDismissBtn");
const mobileInstallBtn = document.getElementById("mobileInstallBtn");
const offlineIndicatorBanner = document.getElementById("offlineIndicatorBanner");

// Sidebar & Tabs Selectors
const sidebarRecsList = document.getElementById("sidebarRecsList");
const sidebarGroupsList = document.getElementById("sidebarGroupsList");
const sidebarSqlWidget = document.getElementById("sidebarSqlWidget");
const fullRecsGrid = document.getElementById("fullRecsGrid");
const groupsGrid = document.getElementById("groupsGrid");
const usersGrid = document.getElementById("usersGrid");
const analyticsGrid = document.getElementById("analyticsGrid");
const telemetryEventsList = document.getElementById("telemetryEventsList");
const refreshAnalyticsBtn = document.getElementById("refreshAnalyticsBtn");

// Chat Selectors
const conversationsList = document.getElementById("conversationsList");
const chatMessagesList = document.getElementById("chatMessagesList");
const chatPartnerName = document.getElementById("chatPartnerName");
const chatPartnerAvatar = document.getElementById("chatPartnerAvatar");
const directSelfName = document.getElementById("directSelfName");
const sendMessageForm = document.getElementById("sendMessageForm");
const messageInput = document.getElementById("messageInput");
const mobileBackToChatList = document.getElementById("mobileBackToChatList");
const chatSidebar = document.getElementById("chatSidebar");
const chatMain = document.getElementById("chatMain");
const unreadMsgBadge = document.getElementById("unreadMsgBadge");

// SQL Studio Selectors
const sqlQueryInput = document.getElementById("sqlQueryInput");
const runSqlQueryBtn = document.getElementById("runSqlQueryBtn");
const sqlPresetButtons = document.getElementById("sqlPresetButtons");
const sqlResultsContainer = document.getElementById("sqlResultsContainer");
const resultsMetaText = document.getElementById("resultsMetaText");
const executionTimeBadge = document.getElementById("executionTimeBadge");
const sqlExecutionStatus = document.getElementById("sqlExecutionStatus");
const schemaTablesList = document.getElementById("schemaTablesList");
const schemaTableCount = document.getElementById("schemaTableCount");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");

// Modals Selectors
const notificationsModal = document.getElementById("notificationsModal");
const mobileNotifBtn = document.getElementById("mobileNotifBtn");
const notifBadge = document.getElementById("notifBadge");
const closeNotifModalBtn = document.getElementById("closeNotifModalBtn");
const notifListContainer = document.getElementById("notifListContainer");

const createGroupModal = document.getElementById("createGroupModal");
const openCreateGroupModalBtn = document.getElementById("openCreateGroupModalBtn");
const closeGroupModalBtn = document.getElementById("closeGroupModalBtn");
const createGroupForm = document.getElementById("createGroupForm");
const groupNameInput = document.getElementById("groupNameInput");
const groupDescInput = document.getElementById("groupDescInput");
const groupPrivacySelect = document.getElementById("groupPrivacySelect");

// Story & Profile Modals
const storyViewerModal = document.getElementById("storyViewerModal");
const storyModalAvatar = document.getElementById("storyModalAvatar");
const storyModalUname = document.getElementById("storyModalUname");
const storyModalImg = document.getElementById("storyModalImg");
const storyModalTextOverlay = document.getElementById("storyModalTextOverlay");
const closeStoryModalBtn = document.getElementById("closeStoryModalBtn");

const userProfileModal = document.getElementById("userProfileModal");
const profModalAvatar = document.getElementById("profModalAvatar");
const profModalUsername = document.getElementById("profModalUsername");
const profModalBadge = document.getElementById("profModalBadge");
const profModalBio = document.getElementById("profModalBio");
const profModalPostsCount = document.getElementById("profModalPostsCount");
const profModalFollowersCount = document.getElementById("profModalFollowersCount");
const profModalFollowingCount = document.getElementById("profModalFollowingCount");
const profModalFollowBtn = document.getElementById("profModalFollowBtn");
const profModalSendMsgBtn = document.getElementById("profModalSendMsgBtn");
const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");

// SVG Icons
const ICONS = {
    heartOutline: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    heartFilled: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ed4956" stroke="#ed4956" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    share: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
};

// ================= INITIALIZATION & AUTH GATE =================
document.addEventListener("DOMContentLoaded", async () => {
    initPwaServiceWorker();
    setupAuthListeners();
    setupTabNavigation();
    setupEventListeners();

    // Check for cached auth user session
    const savedUserJson = localStorage.getItem("socialsphere_auth_user");
    if (savedUserJson) {
        try {
            activeAuthUser = JSON.parse(savedUserJson);
            activeUserId = activeAuthUser.user_id;
            activeUserObj = activeAuthUser;
            await enterAppSession();
        } catch (e) {
            localStorage.removeItem("socialsphere_auth_user");
            showAuthGate();
        }
    } else {
        showAuthGate();
    }
});

function showAuthGate() {
    if (authGateOverlay) authGateOverlay.style.display = "flex";
    if (appLayoutSection) appLayoutSection.style.display = "none";
    if (mobileBottomNav) mobileBottomNav.style.display = "none";
}

async function enterAppSession() {
    if (authGateOverlay) authGateOverlay.style.display = "none";
    if (appLayoutSection) appLayoutSection.style.display = "flex";
    if (mobileBottomNav) mobileBottomNav.style.display = "flex";

    // Parallelize initial data loads for faster startup
    await Promise.all([loadUsers(), loadFollowingSet()]);
    updateActiveUserDisplay();
    updateAdminPermissionsUI();

    if (window.location.pathname.endsWith("/sql") && isSuperAdmin()) {
        switchTab("sql-tab");
    } else {
        // Parallelize sidebar widgets with feed refresh
        await Promise.all([refreshFeed(), loadSidebarWidgets()]);
    }

    await checkNotifications();
}

function isSuperAdmin() {
    if (!activeUserObj) return false;
    return (
        activeUserObj.username?.toLowerCase() === "rajarshi" ||
        activeUserObj.admin_level === "SUPER_ADMIN"
    );
}

function updateAdminPermissionsUI() {
    const adminRestrictedElements = document.querySelectorAll(".admin-restricted");
    const isSuper = isSuperAdmin();

    adminRestrictedElements.forEach(el => {
        if (isSuper) {
            el.classList.remove("admin-restricted");
        } else {
            el.style.display = "none";
        }
    });

    if (sidebarAdminBadge) {
        sidebarAdminBadge.style.display = isSuper ? "inline-block" : "none";
    }
    if (feedAdminBadge) {
        feedAdminBadge.style.display = isSuper ? "inline-block" : "none";
    }
}

// ================= AUTH LISTENERS & ACTIONS =================
function setupAuthListeners() {
    // Switch between Login and Register tabs
    if (tabBtnLogin && tabBtnRegister) {
        tabBtnLogin.addEventListener("click", () => {
            tabBtnLogin.classList.add("active");
            tabBtnRegister.classList.remove("active");
            loginForm.style.display = "flex";
            registerForm.style.display = "none";
            if (loginErrorMsg) loginErrorMsg.style.display = "none";
            if (registerErrorMsg) registerErrorMsg.style.display = "none";
        });

        tabBtnRegister.addEventListener("click", () => {
            tabBtnRegister.classList.add("active");
            tabBtnLogin.classList.remove("active");
            loginForm.style.display = "none";
            registerForm.style.display = "flex";
            if (loginErrorMsg) loginErrorMsg.style.display = "none";
            if (registerErrorMsg) registerErrorMsg.style.display = "none";
        });
    }

    // Login submit
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uname = loginUsername.value.trim();
            const pass = loginPassword.value.trim();
            await performLogin(uname, pass);
        });
    }

    // Register submit
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uname = regUsername.value.trim();
            const email = regEmail.value.trim().toLowerCase();
            const pass = regPassword.value.trim();
            const bio = regBio.value.trim();
            const loc = regLocation.value.trim();
            const interests = regInterests.value.trim();

            // Strict client-side email format regex
            const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
            if (!emailPattern.test(email) || email.split(".").pop().length < 2) {
                if (registerErrorMsg) {
                    registerErrorMsg.textContent = "Please enter a valid email address with domain (e.g. user@example.com).";
                    registerErrorMsg.style.display = "block";
                }
                return;
            }

            await performRegister({
                username: uname,
                email: email,
                password: pass,
                bio: bio,
                location: loc,
                interests: interests
            });
        });
    }

    // Demo user chip buttons
    document.querySelectorAll(".btn-demo-chip[data-user]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const u = btn.getAttribute("data-user");
            const p = btn.getAttribute("data-pass");
            loginUsername.value = u;
            loginPassword.value = p;
            await performLogin(u, p);
        });
    });

    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener("click", handleLogout);
    }
}

async function performLogin(username, password) {
    if (loginErrorMsg) loginErrorMsg.style.display = "none";
    if (submitLoginBtn) {
        submitLoginBtn.disabled = true;
        submitLoginBtn.innerHTML = `<span>Authenticating...</span>`;
    }

    try {
        const res = await fetch("/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
            activeAuthUser = data.user;
            activeUserId = data.user.user_id;
            activeUserObj = data.user;
            localStorage.setItem("socialsphere_auth_user", JSON.stringify(data.user));
            await enterAppSession();
        } else {
            if (loginErrorMsg) {
                loginErrorMsg.textContent = data.detail || "Invalid login credentials. Please try again.";
                loginErrorMsg.style.display = "block";
            }
        }
    } catch (err) {
        if (loginErrorMsg) {
            loginErrorMsg.textContent = "Network error: " + err.message;
            loginErrorMsg.style.display = "block";
        }
    } finally {
        if (submitLoginBtn) {
            submitLoginBtn.disabled = false;
            submitLoginBtn.innerHTML = `<span>Log in</span>`;
        }
    }
}

async function performRegister(payload) {
    if (registerErrorMsg) registerErrorMsg.style.display = "none";
    if (submitRegisterBtn) {
        submitRegisterBtn.disabled = true;
        submitRegisterBtn.innerHTML = `<span>Creating Account...</span>`;
    }

    try {
        const res = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
            activeAuthUser = data.user;
            activeUserId = data.user.user_id;
            activeUserObj = data.user;
            localStorage.setItem("socialsphere_auth_user", JSON.stringify(data.user));
            await enterAppSession();
        } else {
            if (registerErrorMsg) {
                registerErrorMsg.textContent = data.detail || "Registration failed. Please verify your details.";
                registerErrorMsg.style.display = "block";
            }
        }
    } catch (err) {
        if (registerErrorMsg) {
            registerErrorMsg.textContent = "Network error: " + err.message;
            registerErrorMsg.style.display = "block";
        }
    } finally {
        if (submitRegisterBtn) {
            submitRegisterBtn.disabled = false;
            submitRegisterBtn.innerHTML = `<span>Create Account</span>`;
        }
    }
}

async function handleLogout() {
    if (activeUserId) {
        try {
            await fetch("/api/users/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: activeUserId })
            });
        } catch (e) {
            // Ignore telemetry error on logout
        }
    }

    localStorage.removeItem("socialsphere_auth_user");
    activeAuthUser = null;
    activeUserId = null;
    activeUserObj = null;
    followingSet.clear();
    showAuthGate();
}

// ================= USERS & SOCIAL FOLLOW SYSTEM =================
async function loadUsers() {
    try {
        const viewerParam = activeUserId ? `?viewer_id=${activeUserId}` : "";
        const res = await fetch(`/api/users${viewerParam}`);
        const data = await res.json();
        if (data.success && data.users) {
            usersCache = data.users;
        }
    } catch (err) {
        console.error("Error loading users:", err);
    }
}

async function loadFollowingSet() {
    if (!activeUserId) return;
    try {
        const res = await fetch(`/api/users/${activeUserId}/following`);
        const data = await res.json();
        if (data.success && data.following) {
            followingSet = new Set(data.following.map(u => u.user_id));
        }
    } catch (e) {
        console.error("Error loading following set:", e);
    }
}

async function toggleFollowUser(targetUserId, btnElement) {
    if (!activeUserId) {
        showAuthGate();
        return;
    }
    if (activeUserId === targetUserId) {
        alert("You cannot follow yourself.");
        return;
    }

    try {
        if (btnElement) btnElement.disabled = true;

        const res = await fetch(`/api/users/${targetUserId}/follow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caller_id: activeUserId })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            if (data.following) {
                followingSet.add(targetUserId);
            } else {
                followingSet.delete(targetUserId);
            }

            // Update all buttons for this target user on the page
            updateFollowButtonsState(targetUserId, data.following);

            // Update follower count in profile modal if open
            if (profModalFollowersCount) {
                profModalFollowersCount.textContent = data.followers_count;
            }
        }
    } catch (err) {
        console.error("Error toggling follow:", err);
    } finally {
        if (btnElement) btnElement.disabled = false;
    }
}

function updateFollowButtonsState(targetUserId, isFollowing) {
    document.querySelectorAll(`.btn-follow-toggle[data-target-id="${targetUserId}"]`).forEach(btn => {
        if (isFollowing) {
            btn.className = "btn-following btn-follow-toggle";
            btn.textContent = "Following";
        } else {
            btn.className = "btn-follow btn-follow-toggle";
            btn.textContent = "Follow";
        }
    });

    if (profModalFollowBtn && profModalFollowBtn.getAttribute("data-target-id") == targetUserId) {
        if (isFollowing) {
            profModalFollowBtn.className = "btn-following";
            profModalFollowBtn.textContent = "Following";
        } else {
            profModalFollowBtn.className = "btn-follow";
            profModalFollowBtn.textContent = "Follow";
        }
    }
}

function updateActiveUserDisplay() {
    if (!activeUserObj) return;

    const avatarUrl = activeUserObj.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    const uname = activeUserObj.username || "User";

    if (headerUserAvatar) headerUserAvatar.src = avatarUrl;
    if (sidebarUserAvatar) sidebarUserAvatar.src = avatarUrl;
    if (currentUserAvatar) currentUserAvatar.src = avatarUrl;
    if (mobileUserAvatar) mobileUserAvatar.src = avatarUrl;

    if (sidebarUserName) sidebarUserName.textContent = uname;
    if (sidebarSelfName) sidebarSelfName.textContent = uname;
    if (currentUserName) currentUserName.textContent = uname;
    if (directSelfName) directSelfName.textContent = uname;

    const roleDesc = activeUserObj.admin_level ? "Lead Architect & Admin" : (activeUserObj.bio || "Platform Member");
    if (sidebarUserRoleDesc) sidebarUserRoleDesc.textContent = roleDesc;
    if (sidebarSelfRole) sidebarSelfRole.textContent = activeUserObj.admin_level || "Member";
}

// ================= TAB NAVIGATION =================
function setupTabNavigation() {
    const allNavButtons = document.querySelectorAll(".insta-nav-link[data-tab], .mobile-nav-btn[data-tab]");
    allNavButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    const sidebarCreatePostBtn = document.getElementById("sidebarCreatePostBtn");
    if (sidebarCreatePostBtn) {
        sidebarCreatePostBtn.addEventListener("click", () => {
            switchTab("feed-tab");
            const box = document.getElementById("createPostBoxSection");
            if (box) box.scrollIntoView({ behavior: "smooth" });
            if (postContent) postContent.focus();
        });
    }

    const mobileCreatePostBtn = document.getElementById("mobileCreatePostBtn");
    if (mobileCreatePostBtn) {
        mobileCreatePostBtn.addEventListener("click", () => {
            switchTab("feed-tab");
            const box = document.getElementById("createPostBoxSection");
            if (box) box.scrollIntoView({ behavior: "smooth" });
            if (postContent) postContent.focus();
        });
    }

    const launchSqlBtn = document.getElementById("launchSqlBtn");
    if (launchSqlBtn) {
        launchSqlBtn.addEventListener("click", () => {
            if (isSuperAdmin()) switchTab("sql-tab");
        });
    }
}

function switchTab(targetTabId) {
    if ((targetTabId === "sql-tab" || targetTabId === "analytics-tab") && !isSuperAdmin()) {
        targetTabId = "feed-tab";
    }

    document.querySelectorAll(".insta-nav-link[data-tab], .mobile-nav-btn[data-tab]").forEach(btn => {
        if (btn.getAttribute("data-tab") === targetTabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    const targetSection = document.getElementById(targetTabId);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (targetTabId === "feed-tab") refreshFeed();
    if (targetTabId === "messages-tab") loadConversations();
    if (targetTabId === "groups-tab") loadCommunityGroups();
    if (targetTabId === "recommendations-tab") loadRecommendations();
    if (targetTabId === "sql-tab" && isSuperAdmin()) initSqlStudio();
    if (targetTabId === "analytics-tab" && isSuperAdmin()) loadAnalyticsData();
    if (targetTabId === "users-tab") renderUsersDirectory();
}

function setupEventListeners() {
    // Image URL preview for post creation
    if (postUrl) {
        postUrl.addEventListener("input", () => {
            const url = postUrl.value.trim();
            if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
                createPostPreviewImg.src = url;
                createPostPreviewBox.style.display = "block";
            } else {
                createPostPreviewBox.style.display = "none";
            }
        });
    }

    if (removePreviewImgBtn) {
        removePreviewImgBtn.addEventListener("click", () => {
            postUrl.value = "";
            createPostPreviewBox.style.display = "none";
        });
    }

    if (submitPostBtn) submitPostBtn.addEventListener("click", handleCreatePost);

    if (clearHashtagFilter) clearHashtagFilter.addEventListener("click", () => clearTagFilter());
    if (removeFilterBtn) removeFilterBtn.addEventListener("click", () => clearTagFilter());

    if (refreshAnalyticsBtn) refreshAnalyticsBtn.addEventListener("click", loadAnalyticsData);

    if (runSqlQueryBtn) runSqlQueryBtn.addEventListener("click", handleExecuteSql);
    if (sqlQueryInput) {
        sqlQueryInput.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleExecuteSql();
            }
        });
    }
    if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportResultsAsCsv);
    if (exportJsonBtn) exportJsonBtn.addEventListener("click", exportResultsAsJson);

    if (sendMessageForm) sendMessageForm.addEventListener("submit", handleSendMessage);
    if (mobileBackToChatList) {
        mobileBackToChatList.addEventListener("click", () => {
            chatSidebar.style.display = "flex";
            chatMain.style.display = "none";
        });
    }

    // Modal listeners
    if (mobileNotifBtn) mobileNotifBtn.addEventListener("click", openNotificationsModal);
    if (closeNotifModalBtn) closeNotifModalBtn.addEventListener("click", () => notificationsModal.style.display = "none");
    if (closeStoryModalBtn) closeStoryModalBtn.addEventListener("click", () => storyViewerModal.style.display = "none");
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", () => userProfileModal.style.display = "none");

    if (openCreateGroupModalBtn) openCreateGroupModalBtn.addEventListener("click", () => createGroupModal.style.display = "flex");
    if (closeGroupModalBtn) closeGroupModalBtn.addEventListener("click", () => createGroupModal.style.display = "none");
    if (createGroupForm) createGroupForm.addEventListener("submit", handleCreateCommunityGroup);

    window.addEventListener("click", (e) => {
        if (e.target === notificationsModal) notificationsModal.style.display = "none";
        if (e.target === createGroupModal) createGroupModal.style.display = "none";
        if (e.target === storyViewerModal) storyViewerModal.style.display = "none";
        if (e.target === userProfileModal) userProfileModal.style.display = "none";
    });
}

// ================= FEED & POSTS =================
async function refreshFeed() {
    // Parallelize all three feed data sources simultaneously
    await Promise.all([renderStoriesTray(), loadHashtags(), loadPostsFeed()]);
}

async function renderStoriesTray() {
    if (!storiesTrayList) return;
    const storiesUsers = usersCache.slice(0, 8);
    storiesTrayList.innerHTML = storiesUsers.map(u => `
        <div class="story-bubble-item" onclick="openStoryViewer(${u.user_id})">
            <div class="story-ring-gradient">
                <img class="story-avatar-img" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=75'}" alt="${u.username}" loading="lazy">
            </div>
            <span class="story-uname-label">${u.username}</span>
        </div>
    `).join("");
}

async function loadHashtags() {
    if (!feedHashtagsList) return;
    try {
        const res = await fetch("/api/posts/hashtags");
        const data = await res.json();
        if (data.success && data.hashtags) {
            feedHashtagsList.innerHTML = data.hashtags.map(h => `
                <span class="tag-pill ${currentTagFilter === h.tag ? 'active' : ''}" data-tag="${h.tag}">
                    #${h.tag} (${h.post_count})
                </span>
            `).join("");

            document.querySelectorAll(".tag-pill[data-tag]").forEach(pill => {
                pill.addEventListener("click", () => {
                    const tag = pill.getAttribute("data-tag");
                    setTagFilter(tag);
                });
            });
        }
    } catch (err) {
        console.error("Error loading hashtags:", err);
    }
}

function setTagFilter(tag) {
    currentTagFilter = tag;
    if (filterTagName) filterTagName.textContent = `#${tag}`;
    if (activeFilterBanner) activeFilterBanner.style.display = "flex";
    if (clearHashtagFilter) clearHashtagFilter.style.display = "inline-block";
    refreshFeed();
}

function clearTagFilter() {
    currentTagFilter = null;
    if (activeFilterBanner) activeFilterBanner.style.display = "none";
    if (clearHashtagFilter) clearHashtagFilter.style.display = "none";
    refreshFeed();
}

async function loadPostsFeed() {
    if (!postsList) return;
    postsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-secondary); font-size: 13px;">Loading feed posts...</div>`;

    try {
        const url = currentTagFilter ? `/api/posts/hashtag/${currentTagFilter}` : "/api/posts";
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.posts) {
            if (data.posts.length === 0) {
                postsList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: var(--ig-surface); border: 1px solid var(--ig-border); border-radius: var(--radius-md);">
                        <h4 style="margin-bottom: 6px;">No posts found</h4>
                        <p style="font-size: 13px; color: var(--ig-text-secondary);">Be the first to share an update with the community.</p>
                    </div>
                `;
                return;
            }

            postsList.innerHTML = data.posts.map(renderInstagramPostCard).join("");
            attachInstagramPostListeners();
        }
    } catch (err) {
        postsList.innerHTML = `<div class="sql-error-banner">Could not load posts feed: ${err.message}</div>`;
    }
}

function renderInstagramPostCard(post) {
    const avatar = post.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    const hasMedia = Boolean(post.url);
    const reactions = post.reactions || [];
    const totalLikes = reactions.length;
    const userLiked = reactions.some(r => r.user_id === activeUserId);
    const comments = post.comments || [];
    const commentCount = post.comment_count || comments.length;

    let likesText = `${totalLikes} likes`;
    if (totalLikes === 1) likesText = `1 like`;
    else if (totalLikes > 1 && reactions[0]?.username) {
        likesText = `Liked by <strong>${reactions[0].username}</strong> and <strong>${totalLikes - 1} others</strong>`;
    }

    return `
        <article class="post-card" data-post-id="${post.post_id}">
            <!-- Author Row -->
            <div class="post-header-row">
                <div class="post-author-info" onclick="openProfileModal(${post.user_id})">
                    <img class="avatar-square-sm" src="${avatar}" alt="${post.username}" loading="lazy">
                    <div>
                        <div class="post-author-name">${post.username}</div>
                        <span class="post-timestamp-text">${post.created_date || 'Just now'}</span>
                    </div>
                </div>
                <span class="post-role-badge">${post.visibility || 'PUBLIC'}</span>
            </div>

            <!-- Media Content -->
            ${hasMedia ? `
                <div class="post-media-box">
                    <img src="${post.url}" alt="Post Media" loading="lazy" decoding="async" onerror="this.parentElement.style.display='none';">
                </div>
            ` : ''}

            <!-- Text Content -->
            ${!hasMedia && post.content ? `
                <div class="post-text-body">${escapeHTML(post.content)}</div>
            ` : ''}

            <!-- Action Buttons Bar -->
            <div class="post-actions-bar">
                <div class="actions-left">
                    <button class="action-icon-btn ${userLiked ? 'liked' : ''}" data-action="toggle-like" data-post-id="${post.post_id}" title="Like">
                        ${userLiked ? ICONS.heartFilled : ICONS.heartOutline}
                    </button>
                    <button class="action-icon-btn" data-action="focus-comment" data-post-id="${post.post_id}" title="Comment">
                        ${ICONS.comment}
                    </button>
                    <button class="action-icon-btn" onclick="startDirectChat(${post.user_id})" title="Direct Message">
                        ${ICONS.share}
                    </button>
                </div>
                <button class="action-icon-btn" title="Save Post">
                    ${ICONS.bookmark}
                </button>
            </div>

            <!-- Likes & Caption -->
            <div class="post-meta-details">
                <div class="post-likes-count">${likesText}</div>
                
                ${(hasMedia && post.content) ? `
                    <div class="post-caption-row">
                        <span class="post-caption-uname" onclick="openProfileModal(${post.user_id})">${post.username}</span>
                        <span>${escapeHTML(post.content)}</span>
                    </div>
                ` : ''}

                ${(post.hashtags && post.hashtags.length > 0) ? `
                    <div class="post-hashtags-wrap">
                        ${post.hashtags.map(tag => `<span class="post-tag-item" data-tag="${tag}">#${tag}</span>`).join(" ")}
                    </div>
                ` : ''}
            </div>

            <!-- Comments Stream -->
            <div class="post-comments-wrapper">
                ${commentCount > 2 ? `
                    <button class="view-comments-toggle btn-text-sm" data-action="toggle-comments" data-post-id="${post.post_id}">
                        View all ${commentCount} comments
                    </button>
                ` : ''}

                <div class="comments-list-stream" id="commentsStream-${post.post_id}">
                    ${comments.slice(-3).map(c => `
                        <div class="comment-row">
                            <span class="comment-uname" onclick="openProfileModal(${c.user_id})">${c.username}</span>
                            <span class="comment-text-content">${escapeHTML(c.content || '')}</span>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Comment Form -->
            <form class="post-comment-form" data-post-id="${post.post_id}">
                <input type="text" class="post-comment-input" placeholder="Add a comment..." required>
                <button type="submit" class="btn-comment-submit">Post</button>
            </form>
        </article>
    `;
}

function attachInstagramPostListeners() {
    // Like button toggle
    document.querySelectorAll(".action-icon-btn[data-action='toggle-like']").forEach(btn => {
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
                console.error("Error toggling like:", err);
            }
        });
    });

    // Focus comment field
    document.querySelectorAll(".action-icon-btn[data-action='focus-comment']").forEach(btn => {
        btn.addEventListener("click", () => {
            const postId = btn.getAttribute("data-post-id");
            const form = document.querySelector(`.post-comment-form[data-post-id='${postId}']`);
            if (form) {
                const input = form.querySelector(".post-comment-input");
                if (input) input.focus();
            }
        });
    });

    // Click hashtag to filter
    document.querySelectorAll(".post-tag-item[data-tag]").forEach(h => {
        h.addEventListener("click", () => {
            const tag = h.getAttribute("data-tag");
            setTagFilter(tag);
        });
    });

    // Submit inline comment
    document.querySelectorAll(".post-comment-form").forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const postId = form.getAttribute("data-post-id");
            const input = form.querySelector(".post-comment-input");
            const content = input.value.trim();
            if (!content) return;

            const submitBtn = form.querySelector(".btn-comment-submit");
            if (submitBtn) submitBtn.disabled = true;

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
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    });
}

async function handleCreatePost() {
    const content = postContent.value.trim();
    const url = postUrl.value.trim();

    if (!content && !url) {
        alert("Please enter post text or attach an image URL.");
        return;
    }

    if (submitPostBtn) {
        submitPostBtn.disabled = true;
        submitPostBtn.textContent = "Sharing...";
    }

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
            createPostPreviewBox.style.display = "none";
            await refreshFeed();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to create post.");
        }
    } catch (e) {
        alert("Error publishing post: " + e.message);
    } finally {
        if (submitPostBtn) {
            submitPostBtn.disabled = false;
            submitPostBtn.textContent = "Share";
        }
    }
}

// ================= SIDEBAR WIDGETS =================
async function loadSidebarWidgets() {
    // Parallelize sidebar widgets
    await Promise.all([loadSuggestedConnections(), loadSidebarCommunities()]);
}

async function loadSuggestedConnections() {
    if (!sidebarRecsList) return;
    try {
        const res = await fetch(`/api/recommendations/${activeUserId}`);
        const data = await res.json();
        if (data.success && data.recommendations) {
            const recs = data.recommendations.slice(0, 5);
            sidebarRecsList.innerHTML = recs.map(r => {
                const isFollowing = followingSet.has(r.RecommendedUserID);
                return `
                    <div class="sidebar-rec-item">
                        <img class="avatar-square-sm" src="${r.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=75'}" alt="${r.Username}" onclick="openProfileModal(${r.RecommendedUserID})" loading="lazy">
                        <div class="rec-user-meta" onclick="openProfileModal(${r.RecommendedUserID})">
                            <span class="rec-uname">${r.Username}</span>
                            <span class="rec-match">${Math.round(r.Score * 100)}% match</span>
                        </div>
                        <button class="${isFollowing ? 'btn-following' : 'btn-follow'} btn-follow-toggle" data-target-id="${r.RecommendedUserID}" onclick="toggleFollowUser(${r.RecommendedUserID}, this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                `;
            }).join("");
        }
    } catch (e) {
        console.error("Error loading recommendations:", e);
    }
}

async function loadSidebarCommunities() {
    if (!sidebarGroupsList) return;
    try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (data.success && data.groups) {
            const groups = data.groups.slice(0, 3);
            sidebarGroupsList.innerHTML = groups.map(g => `
                <div class="sidebar-group-item" onclick="switchTab('groups-tab')">
                    <div class="group-icon-square">${escapeHTML(g.group_name.slice(0, 2).toUpperCase())}</div>
                    <div class="sidebar-group-meta">
                        <span class="group-title">${g.group_name}</span>
                        <span class="group-sub">${g.member_count || 1} members &middot; ${g.privacy_setting}</span>
                    </div>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Error loading sidebar communities:", e);
    }
}

// ================= RECOMMENDATIONS & COMMUNITIES TABS =================
async function loadRecommendations() {
    if (!fullRecsGrid) return;
    fullRecsGrid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-secondary);">Loading suggested connections...</div>`;
    try {
        const res = await fetch(`/api/recommendations/${activeUserId}`);
        const data = await res.json();
        if (data.success && data.recommendations) {
            if (data.recommendations.length === 0) {
                fullRecsGrid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-muted);">No suggestions right now. Check back soon!</div>`;
                return;
            }
            fullRecsGrid.innerHTML = data.recommendations.map(r => {
                const isFollowing = followingSet.has(r.RecommendedUserID);
                return `
                    <div class="profile-card">
                        <img class="profile-avatar-lg" src="${r.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=75'}" alt="${r.Username}" onclick="openProfileModal(${r.RecommendedUserID})" loading="lazy">
                        <h3 class="profile-name" onclick="openProfileModal(${r.RecommendedUserID})">${r.Username}</h3>
                        <span class="role-badge regular">${Math.round(r.Score * 100)}% Compatibility</span>
                        <p class="profile-bio">${escapeHTML(r.Bio || 'SocialSphere member')}</p>
                        <div class="profile-meta-tags">
                            ${r.Location ? `<span>${r.Location}</span>` : ''}
                            ${r.Interests ? `<span>${r.Interests}</span>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; width: 100%; margin-top: 10px;">
                            <button class="${isFollowing ? 'btn-following' : 'btn-follow'} btn-follow-toggle" style="flex: 1;" data-target-id="${r.RecommendedUserID}" onclick="toggleFollowUser(${r.RecommendedUserID}, this)">
                                ${isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button class="btn-insta-secondary" style="flex: 1;" onclick="startDirectChat(${r.RecommendedUserID})">
                                Message
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        }
    } catch (e) {
        fullRecsGrid.innerHTML = `<div class="sql-error-banner">Could not load recommendations.</div>`;
    }
}

async function loadCommunityGroups() {
    if (!groupsGrid) return;
    groupsGrid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-secondary);">Loading community channels...</div>`;
    try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (data.success && data.groups) {
            groupsGrid.innerHTML = data.groups.map(g => `
                <div class="community-card">
                    <div class="community-header">
                        <div class="group-icon-square lg">${escapeHTML(g.group_name.slice(0, 2).toUpperCase())}</div>
                        <div>
                            <h3 class="community-title">${g.group_name}</h3>
                            <span class="community-pill ${g.privacy_setting.toLowerCase()}">${g.privacy_setting}</span>
                        </div>
                    </div>
                    <p class="community-desc">${escapeHTML(g.description || 'Channel for group discussions.')}</p>
                    <div class="community-footer">
                        <span class="member-count-text">${g.member_count || 1} members</span>
                        <button class="btn-insta-secondary" onclick="joinCommunityGroup(${g.group_id})">Join Community</button>
                    </div>
                </div>
            `).join("");
        }
    } catch (e) {
        groupsGrid.innerHTML = `<div class="sql-error-banner">Could not load communities.</div>`;
    }
}

async function handleCreateCommunityGroup(e) {
    e.preventDefault();
    const name = groupNameInput.value.trim();
    const desc = groupDescInput.value.trim();
    const privacy = groupPrivacySelect.value;

    if (!name) return;

    try {
        const res = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                group_name: name,
                description: desc,
                privacy_setting: privacy,
                created_by: activeUserId
            })
        });

        if (res.ok) {
            createGroupModal.style.display = "none";
            createGroupForm.reset();
            await loadCommunityGroups();
            await loadSidebarCommunities();
        } else {
            alert("Failed to create community group.");
        }
    } catch (err) {
        alert("Error creating community: " + err.message);
    }
}

async function joinCommunityGroup(groupId) {
    try {
        const res = await fetch(`/api/groups/${groupId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: activeUserId })
        });
        if (res.ok) {
            alert("You have joined the community!");
            await loadCommunityGroups();
        } else {
            const err = await res.json();
            alert(err.detail || "Already a member of this community.");
        }
    } catch (e) {
        console.error("Error joining community:", e);
    }
}

// ================= MEMBER EXPLORE DIRECTORY =================
function renderUsersDirectory() {
    if (!usersGrid) return;
    usersGrid.innerHTML = usersCache.map(u => {
        const isFollowing = followingSet.has(u.user_id);
        const isSelf = u.user_id === activeUserId;
        return `
            <div class="profile-card">
                <img class="profile-avatar-lg" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${u.username}" onclick="openProfileModal(${u.user_id})">
                <h3 class="profile-name" onclick="openProfileModal(${u.user_id})">${u.username}</h3>
                <span class="role-badge ${u.admin_level ? 'admin' : 'regular'}">
                    ${u.admin_level || 'REGULAR USER'}
                </span>
                <p style="font-size: 11px; color: var(--ig-text-muted); font-family: var(--font-mono);">${u.email}</p>
                <p class="profile-bio">${escapeHTML(u.bio || 'Platform member')}</p>
                <div class="profile-meta-tags">
                    ${u.location ? `<span>${u.location}</span>` : ''}
                    ${u.interests ? `<span>${u.interests}</span>` : ''}
                </div>
                ${!isSelf ? `
                    <div style="display: flex; gap: 8px; width: 100%; margin-top: 10px;">
                        <button class="${isFollowing ? 'btn-following' : 'btn-follow'} btn-follow-toggle" style="flex: 1;" data-target-id="${u.user_id}" onclick="toggleFollowUser(${u.user_id}, this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button class="btn-insta-secondary" style="flex: 1;" onclick="startDirectChat(${u.user_id})">
                            Message
                        </button>
                    </div>
                ` : `
                    <div style="width: 100%; text-align: center; padding: 6px; font-size: 12px; color: var(--ig-text-muted); font-weight: 600;">
                        (Your Account)
                    </div>
                `}
            </div>
        `;
    }).join("");
}

// ================= PROFILE MODAL =================
async function openProfileModal(userId) {
    if (!userProfileModal) return;
    try {
        const viewerParam = activeUserId ? `?viewer_id=${activeUserId}` : "";
        const res = await fetch(`/api/users/${userId}${viewerParam}`);
        const data = await res.json();

        if (data.success && data.user) {
            const u = data.user;
            profModalAvatar.src = u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
            profModalUsername.textContent = u.username;
            profModalBadge.textContent = u.admin_level || 'USER';
            profModalBio.textContent = u.bio || 'No bio provided.';
            profModalPostsCount.textContent = u.posts_count || 0;
            profModalFollowersCount.textContent = u.followers_count || 0;
            profModalFollowingCount.textContent = u.following_count || 0;

            if (u.user_id === activeUserId) {
                profModalFollowBtn.style.display = "none";
            } else {
                profModalFollowBtn.style.display = "block";
                profModalFollowBtn.setAttribute("data-target-id", u.user_id);
                if (u.is_following) {
                    profModalFollowBtn.className = "btn-following";
                    profModalFollowBtn.textContent = "Following";
                } else {
                    profModalFollowBtn.className = "btn-follow";
                    profModalFollowBtn.textContent = "Follow";
                }
                profModalFollowBtn.onclick = () => toggleFollowUser(u.user_id, profModalFollowBtn);
            }

            profModalSendMsgBtn.onclick = () => {
                userProfileModal.style.display = "none";
                startDirectChat(u.user_id);
            };

            userProfileModal.style.display = "flex";
        }
    } catch (e) {
        console.error("Error opening profile modal:", e);
    }
}

// ================= STORY VIEWER =================
async function openStoryViewer(userId) {
    const user = usersCache.find(u => u.user_id === userId);
    if (!user || !storyViewerModal) return;

    storyModalAvatar.src = user.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
    storyModalUname.textContent = user.username;

    // Use high-res imagery for story preview
    const sampleStories = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
        "https://images.unsplash.com/photo-1518770660439-4636190af475"
    ];
    storyModalImg.src = sampleStories[userId % sampleStories.length];
    storyModalTextOverlay.textContent = user.bio || "Live from SocialSphere!";
    storyViewerModal.style.display = "flex";
}

// ================= DIRECT MESSAGING =================
async function loadConversations() {
    if (!conversationsList) return;
    try {
        const res = await fetch(`/api/messages/conversations/${activeUserId}`);
        const data = await res.json();

        if (data.success && data.conversations) {
            if (data.conversations.length === 0) {
                // Show other users to start a conversation
                const otherUsers = usersCache.filter(u => u.user_id !== activeUserId);
                conversationsList.innerHTML = `
                    <div style="padding: 10px; font-size: 12px; color: var(--ig-text-secondary);">Start a new conversation:</div>
                    ${otherUsers.map(u => `
                        <div class="direct-conversation-item" onclick="startDirectChat(${u.user_id})">
                            <img class="avatar-square-sm" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${u.username}">
                            <div class="conv-meta">
                                <span class="conv-uname">${u.username}</span>
                                <span class="conv-preview">Tap to start chatting</span>
                            </div>
                        </div>
                    `).join("")}
                `;
                return;
            }

            conversationsList.innerHTML = data.conversations.map(c => `
                <div class="direct-conversation-item ${c.partner_id === activeChatPartnerId ? 'active' : ''}" onclick="startDirectChat(${c.partner_id})">
                    <img class="avatar-square-sm" src="${c.partner_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${c.partner_username}">
                    <div class="conv-meta">
                        <span class="conv-uname">${c.partner_username}</span>
                        <span class="conv-preview">${escapeHTML(c.last_message || '')}</span>
                    </div>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Error loading conversations:", e);
    }
}

async function startDirectChat(partnerId) {
    activeChatPartnerId = partnerId;
    switchTab("messages-tab");

    const partner = usersCache.find(u => u.user_id === partnerId);
    if (partner) {
        if (chatPartnerName) chatPartnerName.textContent = partner.username;
        if (chatPartnerAvatar) chatPartnerAvatar.src = partner.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
    }

    if (window.innerWidth <= 640) {
        if (chatSidebar) chatSidebar.style.display = "none";
        if (chatMain) chatMain.style.display = "flex";
    }

    await loadChatThread(partnerId);
}

async function loadChatThread(partnerId) {
    if (!chatMessagesList) return;
    try {
        const res = await fetch(`/api/messages/thread?user1=${activeUserId}&user2=${partnerId}`);
        const data = await res.json();

        if (data.success && data.messages) {
            if (data.messages.length === 0) {
                chatMessagesList.innerHTML = `
                    <div class="empty-chat-state">
                        <h4>No messages yet</h4>
                        <p>Say hello to start the conversation!</p>
                    </div>
                `;
                return;
            }

            chatMessagesList.innerHTML = data.messages.map(m => {
                const isSent = m.sender_id === activeUserId;
                return `
                    <div class="direct-msg-row ${isSent ? 'sent' : 'received'}">
                        <div class="direct-bubble ${isSent ? 'sent' : 'received'}">
                            ${escapeHTML(m.content)}
                            <span class="bubble-time">${m.sent_at.slice(11, 16)}</span>
                        </div>
                    </div>
                `;
            }).join("");

            chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
        }
    } catch (e) {
        console.error("Error loading chat messages:", e);
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    if (!activeChatPartnerId) {
        alert("Please select a user to message.");
        return;
    }

    const content = messageInput.value.trim();
    if (!content) return;

    try {
        const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sender_id: activeUserId,
                receiver_id: activeChatPartnerId,
                content: content
            })
        });

        if (res.ok) {
            messageInput.value = "";
            await loadChatThread(activeChatPartnerId);
            await loadConversations();
        }
    } catch (err) {
        console.error("Error sending message:", err);
    }
}

// ================= NOTIFICATIONS =================
async function checkNotifications() {
    if (!activeUserId) return;
    try {
        const res = await fetch(`/api/notifications/${activeUserId}`);
        const data = await res.json();
        if (data.success && data.notifications) {
            if (data.notifications.length > 0) {
                if (notifBadge) notifBadge.style.display = "block";
            } else {
                if (notifBadge) notifBadge.style.display = "none";
            }
        }
    } catch (err) {
        console.error("Error checking notifications:", err);
    }
}

async function openNotificationsModal() {
    if (!notificationsModal) return;
    notificationsModal.style.display = "flex";
    notifListContainer.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--ig-text-secondary); font-size: 13px;">Loading notifications...</div>`;

    try {
        const res = await fetch(`/api/notifications/${activeUserId}`);
        const data = await res.json();

        if (data.success && data.notifications) {
            if (data.notifications.length === 0) {
                notifListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-muted);">No active notifications.</div>`;
                return;
            }

            notifListContainer.innerHTML = data.notifications.map(n => `
                <div class="notif-item">
                    <div>
                        <div class="notif-text">${escapeHTML(n.content)}</div>
                        <div class="notif-time">${n.created_at}</div>
                    </div>
                    <button class="btn-chip" onclick="dismissNotification(${n.notification_id})">Dismiss</button>
                </div>
            `).join("");
        }
    } catch (err) {
        notifListContainer.innerHTML = `<div class="sql-error-banner">Could not load notifications.</div>`;
    }
}

async function dismissNotification(notifId) {
    try {
        await fetch(`/api/notifications/${notifId}`, { method: "DELETE" });
        await openNotificationsModal();
        await checkNotifications();
    } catch (err) {
        console.error("Error dismissing notification:", err);
    }
}

// ================= SQL STUDIO (SUPER ADMIN ONLY) =================
async function initSqlStudio() {
    if (!isSuperAdmin()) return;
    await loadSqlPresets();
    await loadSqlSchema();
}

async function loadSqlPresets() {
    if (!sqlPresetButtons) return;
    try {
        const res = await fetch("/api/sql/presets");
        const data = await res.json();
        if (data.success && data.presets) {
            sqlPresetButtons.innerHTML = data.presets.map(p => `
                <button class="preset-chip" onclick="applySqlPreset('${escapeAttribute(p.sql)}')">
                    ${escapeHTML(p.title)}
                </button>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading SQL presets:", err);
    }
}

function applySqlPreset(sqlString) {
    if (sqlQueryInput) {
        sqlQueryInput.value = sqlString;
        handleExecuteSql();
    }
}

async function loadSqlSchema() {
    if (!schemaTablesList) return;
    try {
        const res = await fetch("/api/sql/schema");
        const data = await res.json();
        if (data.success && data.tables) {
            if (schemaTableCount) schemaTableCount.textContent = data.table_count;
            schemaTablesList.innerHTML = data.tables.map(t => `
                <div class="schema-table-item">
                    <div class="schema-table-head" onclick="applySqlPreset('SELECT * FROM ${t.table_name} LIMIT 20;')">
                        <span class="table-name-txt">${t.table_name}</span>
                        <span class="table-rows-badge">${t.row_count} rows</span>
                    </div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading schema:", err);
    }
}

async function handleExecuteSql() {
    if (!isSuperAdmin()) return;
    const query = sqlQueryInput.value.trim();
    if (!query) return;

    if (sqlExecutionStatus) {
        sqlExecutionStatus.textContent = "RUNNING";
        sqlExecutionStatus.className = "status-pill-running";
    }

    try {
        const res = await fetch("/api/sql/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();
        lastSqlResults = data;

        if (executionTimeBadge) {
            executionTimeBadge.textContent = `${data.execution_time_ms}ms`;
            executionTimeBadge.style.display = "inline-block";
        }

        if (data.success) {
            if (sqlExecutionStatus) {
                sqlExecutionStatus.textContent = "SUCCESS";
                sqlExecutionStatus.className = "status-pill-success";
            }
            if (resultsMetaText) resultsMetaText.textContent = data.message;
            renderSqlResultsTable(data.columns, data.rows);
        } else {
            if (sqlExecutionStatus) {
                sqlExecutionStatus.textContent = "ERROR";
                sqlExecutionStatus.className = "status-pill-error";
            }
            if (resultsMetaText) resultsMetaText.textContent = "Execution failed";
            sqlResultsContainer.innerHTML = `<div class="sql-error-banner">${escapeHTML(data.error || 'SQL Error')}</div>`;
        }
    } catch (err) {
        if (sqlExecutionStatus) {
            sqlExecutionStatus.textContent = "ERROR";
            sqlExecutionStatus.className = "status-pill-error";
        }
        sqlResultsContainer.innerHTML = `<div class="sql-error-banner">Execution error: ${err.message}</div>`;
    }
}

function renderSqlResultsTable(columns, rows) {
    if (!sqlResultsContainer) return;
    if (!rows || rows.length === 0) {
        sqlResultsContainer.innerHTML = `<div class="sql-placeholder-box"><span>Statement returned 0 rows.</span></div>`;
        return;
    }

    sqlResultsContainer.innerHTML = `
        <table class="sql-results-table">
            <thead>
                <tr>${columns.map(c => `<th>${escapeHTML(c)}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr>
                        ${columns.map(c => `<td>${escapeHTML(row[c] !== null && row[c] !== undefined ? String(row[c]) : 'NULL')}</td>`).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function exportResultsAsCsv() {
    if (!lastSqlResults || !lastSqlResults.rows || lastSqlResults.rows.length === 0) {
        alert("No SQL results to export.");
        return;
    }
    const cols = lastSqlResults.columns;
    const csvContent = [
        cols.join(","),
        ...lastSqlResults.rows.map(row => cols.map(c => `"${String(row[c] || '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    downloadFile(csvContent, "query_results.csv", "text/csv");
}

function exportResultsAsJson() {
    if (!lastSqlResults || !lastSqlResults.rows) {
        alert("No SQL results to export.");
        return;
    }
    const jsonContent = JSON.stringify(lastSqlResults.rows, null, 2);
    downloadFile(jsonContent, "query_results.json", "application/json");
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

// ================= ANALYTICS & TELEMETRY (SUPER ADMIN ONLY) =================
async function loadAnalyticsData() {
    if (!isSuperAdmin()) return;
    try {
        const res = await fetch("/api/analytics/overview");
        const data = await res.json();

        if (data.success && data.analytics && analyticsGrid) {
            const a = data.analytics;
            analyticsGrid.innerHTML = `
                <div class="stat-card">
                    <span class="stat-num">${a.totalUsers || 0}</span>
                    <span class="stat-title">Platform Users</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalPosts || 0}</span>
                    <span class="stat-title">Total Posts</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalFollows || 0}</span>
                    <span class="stat-title">Follow Connections</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalGroups || 0}</span>
                    <span class="stat-title">Communities</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalReactions || 0}</span>
                    <span class="stat-title">Reactions / Likes</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalComments || 0}</span>
                    <span class="stat-title">Comments</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalMessages || 0}</span>
                    <span class="stat-title">Direct Messages</span>
                </div>
                <div class="stat-card">
                    <span class="stat-num">${a.totalEvents || 0}</span>
                    <span class="stat-title">Audit Events</span>
                </div>
            `;
        }

        await loadTelemetryLogs();
    } catch (err) {
        console.error("Error loading analytics:", err);
    }
}

async function loadTelemetryLogs() {
    try {
        const res = await fetch("/api/analytics/events?limit=50");
        const data = await res.json();
        if (data.success && data.events && telemetryEventsList) {
            telemetryEventsList.innerHTML = `
                <table class="telemetry-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>USER</th>
                            <th>EVENT TYPE</th>
                            <th>DEVICE</th>
                            <th>METADATA</th>
                            <th>TIMESTAMP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.events.map(e => `
                            <tr>
                                <td>#${e.event_id}</td>
                                <td><strong>${escapeHTML(e.username)}</strong></td>
                                <td><span class="telemetry-tag">${e.event_type}</span></td>
                                <td>${e.device_type || 'WEB'}</td>
                                <td><code>${escapeHTML(e.metadata || '{}')}</code></td>
                                <td style="color: var(--ig-text-muted);">${e.event_time}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }
    } catch (err) {
        console.error("Error loading telemetry logs:", err);
    }
}

// ================= PWA SERVICE WORKER & OFFLINE =================
function initPwaServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
                .catch(err => console.log('[PWA] Service Worker registration failed:', err));
        });
    }

    // Online / Offline Events
    window.addEventListener('online', () => {
        if (offlineIndicatorBanner) offlineIndicatorBanner.style.display = 'none';
        if (activeUserId) refreshFeed();
    });
    window.addEventListener('offline', () => {
        if (offlineIndicatorBanner) offlineIndicatorBanner.style.display = 'block';
    });

    if (!navigator.onLine && offlineIndicatorBanner) {
        offlineIndicatorBanner.style.display = 'block';
    }

    // "Add to Home Screen" install banner
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;

        if (mobileInstallBtn) mobileInstallBtn.style.display = 'inline-block';

        const dismissed = localStorage.getItem('socialsphere_pwa_dismissed');
        if (!dismissed && pwaInstallBanner) {
            pwaInstallBanner.style.display = 'flex';
        }
    });

    if (pwaInstallActionBtn) {
        pwaInstallActionBtn.addEventListener('click', triggerPwaInstall);
    }
    if (mobileInstallBtn) {
        mobileInstallBtn.addEventListener('click', triggerPwaInstall);
    }
    if (pwaDismissBtn) {
        pwaDismissBtn.addEventListener('click', () => {
            if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
            localStorage.setItem('socialsphere_pwa_dismissed', 'true');
        });
    }

    window.addEventListener('appinstalled', () => {
        if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
        if (mobileInstallBtn) mobileInstallBtn.style.display = 'none';
        deferredPwaPrompt = null;
    });
}

async function triggerPwaInstall() {
    if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
            if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
        }
        deferredPwaPrompt = null;
    } else {
        alert("To install SocialSphere on your phone:\n- On Safari (iOS): Tap the Share icon, then select 'Add to Home Screen'.\n- On Chrome (Android): Tap the menu (⋮), then select 'Install app' or 'Add to Home screen'.");
    }
}

// Utilities
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function escapeAttribute(str) {
    if (!str) return "";
    return String(str).replace(/"/g, '&quot;');
}
