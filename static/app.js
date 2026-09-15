/**
 * SocialSphere — Instagram Web & Mobile PWA Application Logic
 * Features: PWA Service Worker Caching, Offline Hydration, "Add to Home Screen" Install Prompt,
 * Dedicated User Credentials & Auth Store, Stories Viewer, User Profile Popup,
 * Dynamic Feed with Instant Likes & Comments, Live Direct Messaging, SQL Studio, and Analytics.
 */

// Global Application State
let activeUserId = 1;
let activeUserObj = null;
let usersCache = [];
let activeChatPartnerId = null;
let currentTagFilter = null;
let lastSqlResults = null;
let deferredPwaPrompt = null;

// DOM Element Selectors
const userSelect = document.getElementById("userSelect");
const headerUserAvatar = document.getElementById("headerUserAvatar");
const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarAdminBadge = document.getElementById("sidebarAdminBadge");
const sidebarSelfName = document.getElementById("sidebarSelfName");
const currentUserAvatar = document.getElementById("currentUserAvatar");
const currentUserName = document.getElementById("currentUserName");
const mobileUserAvatar = document.getElementById("mobileUserAvatar");
const feedAdminBadge = document.getElementById("feedAdminBadge");
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
const navAuthLabel = document.getElementById("navAuthLabel");

// PWA Elements
const pwaInstallBanner = document.getElementById("pwaInstallBanner");
const pwaInstallActionBtn = document.getElementById("pwaInstallActionBtn");
const pwaDismissBtn = document.getElementById("pwaDismissBtn");
const sidebarInstallAppBtn = document.getElementById("sidebarInstallAppBtn");
const mobileInstallBtn = document.getElementById("mobileInstallBtn");
const offlineIndicatorBanner = document.getElementById("offlineIndicatorBanner");

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

// Auth Elements
const tabBtnLogin = document.getElementById("tabBtnLogin");
const tabBtnRegister = document.getElementById("tabBtnRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const submitLoginBtn = document.getElementById("submitLoginBtn");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const quickFillAdminBtn = document.getElementById("quickFillAdminBtn");

const regUsername = document.getElementById("regUsername");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regBio = document.getElementById("regBio");
const regLocation = document.getElementById("regLocation");
const regInterests = document.getElementById("regInterests");
const submitRegisterBtn = document.getElementById("submitRegisterBtn");
const registerErrorMsg = document.getElementById("registerErrorMsg");

// Sidebar & Tabs Selectors
const sidebarRecsList = document.getElementById("sidebarRecsList");
const sidebarGroupsList = document.getElementById("sidebarGroupsList");
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
const profModalSendMsgBtn = document.getElementById("profModalSendMsgBtn");
const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");

// SVG Action Icons
const ICONS = {
    heartOutline: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    heartFilled: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ed4956" stroke="#ed4956" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    share: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
};

// Initial App Bootstrapping
document.addEventListener("DOMContentLoaded", async () => {
    initPwaServiceWorker();
    setupTabNavigation();
    setupEventListeners();
    setupAuthListeners();
    await loadUsers();
    
    // Restore session
    const savedUserId = localStorage.getItem("socialsphere_active_user_id");
    if (savedUserId && usersCache.some(u => u.user_id === parseInt(savedUserId))) {
        activeUserId = parseInt(savedUserId);
    } else if (usersCache.some(u => u.username === "shobita")) {
        activeUserId = usersCache.find(u => u.username === "shobita").user_id;
    }

    updateActiveUserDisplay();

    if (window.location.pathname.endsWith("/sql")) {
        switchTab("sql-tab");
    } else {
        await refreshFeed();
        await loadSidebarWidgets();
    }
    
    await checkNotifications();
});

// PWA Service Worker Registration & Install Prompt
function initPwaServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
                .catch(err => console.log('[PWA] Service Worker registration failed:', err));
        });
    }

    // Online / Offline Detection
    window.addEventListener('online', () => {
        if (offlineIndicatorBanner) offlineIndicatorBanner.style.display = 'none';
        refreshFeed();
    });
    window.addEventListener('offline', () => {
        if (offlineIndicatorBanner) offlineIndicatorBanner.style.display = 'block';
    });

    if (!navigator.onLine && offlineIndicatorBanner) {
        offlineIndicatorBanner.style.display = 'block';
    }

    // Capture beforeinstallprompt event for "Add to Home Screen"
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;

        // Show install button in sidebar & mobile header
        if (sidebarInstallAppBtn) sidebarInstallAppBtn.style.display = 'flex';
        if (mobileInstallBtn) mobileInstallBtn.style.display = 'inline-block';

        // Check if user previously dismissed install prompt
        const dismissed = localStorage.getItem('socialsphere_pwa_dismissed');
        if (!dismissed && pwaInstallBanner) {
            pwaInstallBanner.style.display = 'flex';
        }
    });

    if (pwaInstallActionBtn) {
        pwaInstallActionBtn.addEventListener('click', triggerPwaInstall);
    }
    if (sidebarInstallAppBtn) {
        sidebarInstallAppBtn.addEventListener('click', triggerPwaInstall);
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
        console.log('[PWA] SocialSphere installed to Home Screen successfully!');
        if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
        if (sidebarInstallAppBtn) sidebarInstallAppBtn.style.display = 'none';
        if (mobileInstallBtn) mobileInstallBtn.style.display = 'none';
        deferredPwaPrompt = null;
    });
}

async function triggerPwaInstall() {
    if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        console.log(`[PWA] Install prompt outcome: ${outcome}`);
        if (outcome === 'accepted') {
            if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
        }
        deferredPwaPrompt = null;
    } else {
        alert("To install SocialSphere on your phone:\n- On Safari (iOS): Tap the Share button, then 'Add to Home Screen'.\n- On Chrome (Android): Tap the menu (⋮), then 'Install App' or 'Add to Home screen'.");
    }
}

// Tab Navigation
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
        launchSqlBtn.addEventListener("click", () => switchTab("sql-tab"));
    }
}

function switchTab(targetTabId) {
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
    if (targetTabId === "sql-tab") initSqlStudio();
    if (targetTabId === "analytics-tab") loadAnalyticsData();
    if (targetTabId === "users-tab") renderUsersDirectory();
}

function setupEventListeners() {
    if (userSelect) {
        userSelect.addEventListener("change", async (e) => {
            activeUserId = parseInt(e.target.value);
            localStorage.setItem("socialsphere_active_user_id", activeUserId);
            updateActiveUserDisplay();
            
            const activeTab = document.querySelector(".tab-content.active")?.id;
            if (activeTab === "feed-tab") {
                await refreshFeed();
                await loadSidebarWidgets();
            } else if (activeTab === "messages-tab") {
                await loadConversations();
            } else if (activeTab === "groups-tab") {
                await loadCommunityGroups();
            } else if (activeTab === "recommendations-tab") {
                await loadRecommendations();
            }
            await checkNotifications();
        });
    }

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

    // Logout
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener("click", handleLogout);

    window.addEventListener("click", (e) => {
        if (e.target === notificationsModal) notificationsModal.style.display = "none";
        if (e.target === createGroupModal) createGroupModal.style.display = "none";
        if (e.target === storyViewerModal) storyViewerModal.style.display = "none";
        if (e.target === userProfileModal) userProfileModal.style.display = "none";
    });
}

// 1. Authentication System
function setupAuthListeners() {
    // Switch between Login and Register tabs
    if (tabBtnLogin && tabBtnRegister) {
        tabBtnLogin.addEventListener("click", () => {
            tabBtnLogin.classList.add("active");
            tabBtnRegister.classList.remove("active");
            loginForm.style.display = "flex";
            registerForm.style.display = "none";
            loginErrorMsg.style.display = "none";
            registerErrorMsg.style.display = "none";
        });

        tabBtnRegister.addEventListener("click", () => {
            tabBtnRegister.classList.add("active");
            tabBtnLogin.classList.remove("active");
            loginForm.style.display = "none";
            registerForm.style.display = "flex";
            loginErrorMsg.style.display = "none";
            registerErrorMsg.style.display = "none";
        });
    }

    // Login Form Submit
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uname = loginUsername.value.trim();
            const pass = loginPassword.value.trim();
            await performLogin(uname, pass);
        });
    }

    // Register Form Submit
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uname = regUsername.value.trim();
            const email = regEmail.value.trim();
            const pass = regPassword.value.trim();
            const bio = regBio.value.trim();
            const loc = regLocation.value.trim();
            const interests = regInterests.value.trim();

            await performRegister({ username: uname, email, password: pass, bio, location: loc, interests });
        });
    }

    // Quick Fill Admin button
    if (quickFillAdminBtn) {
        quickFillAdminBtn.addEventListener("click", async () => {
            loginUsername.value = "shobita";
            loginPassword.value = "dbms108";
            await performLogin("shobita", "dbms108");
        });
    }

    // Demo user chips
    document.querySelectorAll(".btn-demo-chip[data-user]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const u = btn.getAttribute("data-user");
            const p = btn.getAttribute("data-pass");
            loginUsername.value = u;
            loginPassword.value = p;
            await performLogin(u, p);
        });
    });
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
            activeUserId = data.user.user_id;
            activeUserObj = data.user;
            localStorage.setItem("socialsphere_active_user_id", activeUserId);
            
            await loadUsers();
            updateActiveUserDisplay();
            switchTab("feed-tab");
            await checkNotifications();
        } else {
            if (loginErrorMsg) {
                loginErrorMsg.textContent = data.detail || "Invalid login credentials.";
                loginErrorMsg.style.display = "block";
            } else {
                alert(data.detail || "Invalid login credentials.");
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
            activeUserId = data.user.user_id;
            activeUserObj = data.user;
            localStorage.setItem("socialsphere_active_user_id", activeUserId);
            
            await loadUsers();
            updateActiveUserDisplay();
            switchTab("feed-tab");
            await checkNotifications();
        } else {
            if (registerErrorMsg) {
                registerErrorMsg.textContent = data.detail || "Registration failed.";
                registerErrorMsg.style.display = "block";
            } else {
                alert(data.detail || "Registration failed.");
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
    try {
        await fetch("/api/users/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: activeUserId })
        });
    } catch (e) {
        // Continue logout locally
    }

    localStorage.removeItem("socialsphere_active_user_id");
    activeUserId = 1;
    switchTab("login-tab");
}

// 2. Users Management
async function loadUsers() {
    try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
            usersCache = data.users;
            if (userSelect) {
                userSelect.innerHTML = usersCache.map(u => `
                    <option value="${u.user_id}" ${u.user_id === activeUserId ? 'selected' : ''}>
                        ${u.username} (${u.admin_level ? 'Admin' : 'User'})
                    </option>
                `).join("");
            }
            renderStoriesTray();
            updateActiveUserDisplay();
        }
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

function updateActiveUserDisplay() {
    const activeUser = usersCache.find(u => u.user_id === activeUserId);
    if (activeUser) {
        activeUserObj = activeUser;
        const avatar = activeUser.profile_pic || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2";

        if (currentUserName) currentUserName.textContent = activeUser.username;
        if (sidebarUserName) sidebarUserName.textContent = activeUser.username;
        if (sidebarSelfName) sidebarSelfName.textContent = activeUser.username;
        if (directSelfName) directSelfName.textContent = activeUser.username;

        if (currentUserAvatar) currentUserAvatar.src = avatar;
        if (sidebarUserAvatar) sidebarUserAvatar.src = avatar;
        if (headerUserAvatar) headerUserAvatar.src = avatar;
        if (mobileUserAvatar) mobileUserAvatar.src = avatar;

        const isAdmin = Boolean(activeUser.admin_level);
        if (sidebarAdminBadge) {
            sidebarAdminBadge.style.display = isAdmin ? "inline-block" : "none";
            sidebarAdminBadge.textContent = activeUser.admin_level || "USER";
        }
        if (feedAdminBadge) {
            feedAdminBadge.style.display = isAdmin ? "inline-block" : "none";
            feedAdminBadge.textContent = activeUser.admin_level || "USER";
        }
        if (navAuthLabel) {
            navAuthLabel.textContent = `User: ${activeUser.username}`;
        }
    }
}

// 3. Instagram Stories Tray
function renderStoriesTray() {
    if (!storiesTrayList) return;
    
    const current = usersCache.find(u => u.user_id === activeUserId);
    const others = usersCache.filter(u => u.user_id !== activeUserId);

    let html = "";
    if (current) {
        html += `
            <div class="story-item" onclick="openStoryModal(${current.user_id})">
                <div class="story-ring-wrap">
                    <img class="story-avatar-img" src="${current.profile_pic || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'}" alt="${current.username}">
                </div>
                <span class="story-username-text">Your story</span>
            </div>
        `;
    }

    others.forEach(u => {
        html += `
            <div class="story-item" onclick="openStoryModal(${u.user_id})">
                <div class="story-ring-wrap">
                    <img class="story-avatar-img" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${u.username}">
                </div>
                <span class="story-username-text">${u.username}</span>
            </div>
        `;
    });

    storiesTrayList.innerHTML = html;
}

function openStoryModal(userId) {
    const user = usersCache.find(u => u.user_id === userId);
    if (!user || !storyViewerModal) return;

    storyModalAvatar.src = user.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    storyModalUname.textContent = user.username;
    
    // Sample story images
    const sampleStories = [
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8"
    ];
    storyModalImg.src = sampleStories[userId % sampleStories.length];
    storyModalTextOverlay.textContent = user.bio || `Active member of SocialSphere & developer collective.`;

    storyViewerModal.style.display = "flex";
}

function openProfileModal(userId) {
    const user = usersCache.find(u => u.user_id === userId);
    if (!user || !userProfileModal) return;

    profModalAvatar.src = user.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    profModalUsername.textContent = user.username;
    profModalBadge.textContent = user.admin_level || "REGULAR USER";
    profModalBadge.className = `admin-badge-pill ${user.admin_level ? 'admin' : ''}`;
    profModalBio.textContent = `${user.bio || 'Platform member'} · Location: ${user.location || 'Global'} · Interests: ${user.interests || 'Tech'}`;
    
    profModalSendMsgBtn.onclick = () => {
        userProfileModal.style.display = "none";
        startDirectChat(userId);
    };

    userProfileModal.style.display = "flex";
}

// 4. Feed & Posts
async function refreshFeed() {
    if (!postsList) return;
    postsList.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--ig-text-secondary); font-size: 13px;">Loading feed posts...</div>`;
    await loadTrendingHashtags();

    try {
        const url = currentTagFilter ? `/api/posts?tag=${encodeURIComponent(currentTagFilter)}` : "/api/posts";
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.posts) {
            if (data.posts.length === 0) {
                postsList.innerHTML = `
                    <div class="post-card" style="text-align: center; padding: 3.5rem; color: var(--ig-text-secondary);">
                        <p style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">No Posts Yet</p>
                        <p style="font-size: 13px;">Create the first post to share with the community.</p>
                    </div>
                `;
                return;
            }

            postsList.innerHTML = data.posts.map(post => renderInstagramPostCard(post)).join("");
            attachInstagramPostListeners();
        }
    } catch (err) {
        postsList.innerHTML = `<div class="sql-error-banner">Failed to retrieve posts from server.</div>`;
    }
}

async function loadTrendingHashtags() {
    if (!feedHashtagsList) return;
    try {
        const res = await fetch("/api/analytics/hashtags");
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
            <!-- Header: Author Row -->
            <div class="post-header-row">
                <div class="post-author-info" onclick="openProfileModal(${post.user_id})">
                    <img class="avatar-square-sm" src="${avatar}" alt="${post.username}">
                    <div>
                        <div class="post-author-name">${post.username}</div>
                        <span class="post-timestamp-text">${post.created_date || 'Just now'}</span>
                    </div>
                </div>
                <span class="post-role-badge">${post.visibility || 'PUBLIC'}</span>
            </div>

            <!-- Media / Image Content -->
            ${hasMedia ? `
                <div class="post-media-box">
                    <img src="${post.url}" alt="Post Media" loading="lazy" onerror="this.parentElement.style.display='none';">
                </div>
            ` : ''}

            <!-- Text Content -->
            ${!hasMedia && post.content ? `
                <div class="post-text-body">${escapeHTML(post.content)}</div>
            ` : ''}

            <!-- Instagram Action Buttons Bar -->
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

            <!-- Likes & Caption Row -->
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

            <!-- Inline Comment Form -->
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

    // Submit new inline comment
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
        alert("Please provide a caption or image URL.");
        return;
    }

    submitPostBtn.disabled = true;
    submitPostBtn.textContent = "Sharing...";

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
            await loadTrendingHashtags();
        } else {
            alert("Could not share post.");
        }
    } catch (err) {
        console.error("Error creating post:", err);
    } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.textContent = "Share";
    }
}

// 5. Sidebar Suggestions & Communities
async function loadSidebarWidgets() {
    try {
        const res = await fetch(`/api/recommendations/${activeUserId}`);
        const data = await res.json();
        if (data.success && data.recommendations && sidebarRecsList) {
            if (data.recommendations.length === 0) {
                sidebarRecsList.innerHTML = `<span style="font-size: 11px; color: var(--ig-text-muted);">No recommendations currently.</span>`;
            } else {
                sidebarRecsList.innerHTML = data.recommendations.slice(0, 4).map(rec => `
                    <div class="rec-mini-item">
                        <div class="rec-mini-user" onclick="openProfileModal(${rec.RecommendedUserID})">
                            <img class="avatar-square-sm" src="${rec.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="Pic">
                            <div>
                                <strong style="font-size: 12px; display: block;">${rec.Username}</strong>
                                <span style="font-size: 11px; color: var(--ig-text-muted);">${rec.Location || 'Suggested for you'}</span>
                            </div>
                        </div>
                        <button class="btn-text-sm" onclick="startDirectChat(${rec.RecommendedUserID})">Message</button>
                    </div>
                `).join("");
            }
        }
    } catch (err) {
        console.error("Error loading sidebar recs:", err);
    }

    try {
        const res = await fetch(`/api/groups?user_id=${activeUserId}`);
        const data = await res.json();
        if (data.success && data.groups && sidebarGroupsList) {
            sidebarGroupsList.innerHTML = data.groups.slice(0, 3).map(g => `
                <div class="rec-mini-item">
                    <div>
                        <strong style="font-size: 12px; display: block;">${g.group_name}</strong>
                        <span style="font-size: 11px; color: var(--ig-text-muted);">${g.member_count} members &middot; ${g.privacy_setting}</span>
                    </div>
                    <button class="btn-chip" onclick="switchTab('groups-tab')">View</button>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading sidebar groups:", err);
    }
}

// 6. Direct Messaging
async function loadConversations() {
    if (!conversationsList) return;
    try {
        const res = await fetch(`/api/messages/conversations/${activeUserId}`);
        const data = await res.json();

        if (data.success) {
            let convos = data.conversations;

            if (convos.length === 0) {
                const otherUsers = usersCache.filter(u => u.user_id !== activeUserId);
                conversationsList.innerHTML = otherUsers.map(u => `
                    <div class="conversation-item" data-partner-id="${u.user_id}">
                        <img class="avatar-square-sm" src="${u.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${u.username}">
                        <div class="convo-info">
                            <div class="convo-top">
                                <span class="convo-name">${u.username}</span>
                                <span class="convo-time">Start</span>
                            </div>
                            <div class="convo-snippet">Click to send a direct message</div>
                        </div>
                    </div>
                `).join("");
            } else {
                conversationsList.innerHTML = convos.map(c => `
                    <div class="conversation-item ${activeChatPartnerId === c.partner.user_id ? 'active' : ''}" data-partner-id="${c.partner.user_id}">
                        <img class="avatar-square-sm" src="${c.partner.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${c.partner.username}">
                        <div class="convo-info">
                            <div class="convo-top">
                                <span class="convo-name">${c.partner.username}</span>
                                <span class="convo-time">${c.last_message ? c.last_message.sent_at.slice(11, 16) : ''}</span>
                            </div>
                            <div class="convo-snippet">${c.last_message ? escapeHTML(c.last_message.content) : 'No messages'}</div>
                        </div>
                    </div>
                `).join("");
            }

            document.querySelectorAll(".conversation-item[data-partner-id]").forEach(item => {
                item.addEventListener("click", () => {
                    const partnerId = parseInt(item.getAttribute("data-partner-id"));
                    openChatThread(partnerId);
                });
            });

            if (!activeChatPartnerId && (convos.length > 0 || usersCache.length > 1)) {
                const firstId = convos.length > 0 ? convos[0].partner.user_id : usersCache.find(u => u.user_id !== activeUserId)?.user_id;
                if (firstId) openChatThread(firstId);
            }
        }
    } catch (err) {
        console.error("Error loading conversations:", err);
    }
}

async function openChatThread(partnerId) {
    activeChatPartnerId = partnerId;
    const partner = usersCache.find(u => u.user_id === partnerId);

    if (partner) {
        if (chatPartnerName) chatPartnerName.textContent = partner.username;
        if (chatPartnerAvatar) chatPartnerAvatar.src = partner.profile_pic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    }

    if (window.innerWidth <= 640 && chatSidebar && chatMain) {
        chatSidebar.style.display = "none";
        chatMain.style.display = "flex";
    }

    if (!chatMessagesList) return;
    chatMessagesList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-secondary); font-size: 12px;">Loading messages...</div>`;

    try {
        const res = await fetch(`/api/messages/thread/${activeUserId}/${partnerId}`);
        const data = await res.json();

        if (data.success && data.messages) {
            if (data.messages.length === 0) {
                chatMessagesList.innerHTML = `
                    <div class="empty-chat-state">
                        ${ICONS.comment}
                        <h4>Direct Message</h4>
                        <p>Send a message to start conversation with <strong>${partner ? partner.username : 'user'}</strong>.</p>
                    </div>
                `;
                return;
            }

            chatMessagesList.innerHTML = data.messages.map(m => {
                const isOutgoing = m.sender_id === activeUserId;
                return `
                    <div class="msg-row ${isOutgoing ? 'outgoing' : 'incoming'}">
                        <div class="msg-content-box">
                            <div>${escapeHTML(m.content)}</div>
                            <span class="msg-timestamp">${m.sent_at ? m.sent_at.slice(11, 16) : ''}</span>
                        </div>
                    </div>
                `;
            }).join("");

            chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
        }
    } catch (err) {
        chatMessagesList.innerHTML = `<div class="sql-error-banner">Failed to load message thread.</div>`;
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
            await openChatThread(activeChatPartnerId);
            await loadConversations();
        }
    } catch (err) {
        console.error("Error sending message:", err);
    }
}

function startDirectChat(targetUserId) {
    switchTab("messages-tab");
    openChatThread(targetUserId);
}

// 7. Community Groups
async function loadCommunityGroups() {
    if (!groupsGrid) return;
    groupsGrid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--ig-text-secondary); font-size: 13px;">Loading communities...</div>`;
    try {
        const res = await fetch(`/api/groups?user_id=${activeUserId}`);
        const data = await res.json();

        if (data.success && data.groups) {
            groupsGrid.innerHTML = data.groups.map(g => `
                <div class="community-card">
                    <div class="comm-top-row">
                        <h3 class="comm-title">${g.group_name}</h3>
                        <span class="comm-privacy-badge">${g.privacy_setting}</span>
                    </div>
                    <p class="comm-desc">${escapeHTML(g.description || 'No description provided.')}</p>
                    <div class="comm-roster-row">
                        <span>${g.member_count} members</span>
                        <div class="comm-avatars-overlap">
                            ${(g.members || []).slice(0, 4).map(m => `
                                <img class="avatar-overlap" src="${m.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" title="${m.username}">
                            `).join("")}
                        </div>
                    </div>
                    <button class="btn-join-toggle ${g.is_member ? 'joined' : 'not-joined'}" data-group-id="${g.group_id}">
                        ${g.is_member ? 'Joined' : 'Join'}
                    </button>
                </div>
            `).join("");

            document.querySelectorAll(".btn-join-toggle[data-group-id]").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const groupId = btn.getAttribute("data-group-id");
                    try {
                        const r = await fetch(`/api/groups/${groupId}/toggle-join`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_id: activeUserId })
                        });
                        if (r.ok) {
                            await loadCommunityGroups();
                        }
                    } catch (e) {
                        console.error("Error toggling group:", e);
                    }
                });
            });
        }
    } catch (err) {
        groupsGrid.innerHTML = `<div class="sql-error-banner">Failed to load groups.</div>`;
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
                user_id: activeUserId,
                group_name: name,
                description: desc,
                privacy_setting: privacy
            })
        });

        if (res.ok) {
            createGroupModal.style.display = "none";
            groupNameInput.value = "";
            groupDescInput.value = "";
            await loadCommunityGroups();
        }
    } catch (err) {
        console.error("Error creating group:", err);
    }
}

// 8. Suggested Connections
async function loadRecommendations() {
    if (!fullRecsGrid) return;
    fullRecsGrid.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--ig-text-secondary); font-size: 13px;">Computing suggested connections...</div>`;
    try {
        const res = await fetch(`/api/recommendations/${activeUserId}`);
        const data = await res.json();

        if (data.success && data.recommendations) {
            if (data.recommendations.length === 0) {
                fullRecsGrid.innerHTML = `<div class="profile-card" style="grid-column: 1/-1; padding: 2.5rem;">No recommendation matches found.</div>`;
                return;
            }

            fullRecsGrid.innerHTML = data.recommendations.map(rec => `
                <div class="profile-card">
                    <img class="profile-avatar-lg" src="${rec.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}" alt="${rec.Username}" onclick="openProfileModal(${rec.RecommendedUserID})">
                    <h3 class="profile-name" onclick="openProfileModal(${rec.RecommendedUserID})">${rec.Username}</h3>
                    <span class="score-pill-sm">
                        ${Math.round(rec.Score * 100)}% Match
                    </span>
                    <p class="profile-bio">${escapeHTML(rec.Bio || 'Platform member')}</p>
                    <div class="profile-meta-tags">
                        ${rec.Location ? `<span>${rec.Location}</span>` : ''}
                        ${rec.Interests ? `<span>${rec.Interests}</span>` : ''}
                    </div>
                    <button class="btn-insta-primary" style="width: 100%;" onclick="startDirectChat(${rec.RecommendedUserID})">
                        Send Message
                    </button>
                </div>
            `).join("");
        }
    } catch (err) {
        fullRecsGrid.innerHTML = `<div class="sql-error-banner">Failed to calculate recommendations.</div>`;
    }
}

// 9. Relational /SQL Studio
async function initSqlStudio() {
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
                <button class="preset-chip" data-sql="${escapeAttribute(p.sql)}">
                    ${p.title}
                </button>
            `).join("");

            document.querySelectorAll(".preset-chip[data-sql]").forEach(btn => {
                btn.addEventListener("click", () => {
                    sqlQueryInput.value = btn.getAttribute("data-sql");
                    handleExecuteSql();
                });
            });

            if (!sqlQueryInput.value.trim()) {
                sqlQueryInput.value = data.presets[0].sql;
            }
        }
    } catch (err) {
        console.error("Error loading presets:", err);
    }
}

async function loadSqlSchema() {
    if (!schemaTablesList) return;
    try {
        const res = await fetch("/api/sql/schema");
        const data = await res.json();
        if (data.success && data.tables) {
            if (schemaTableCount) schemaTableCount.textContent = `${data.table_count}`;
            schemaTablesList.innerHTML = data.tables.map(t => `
                <div class="schema-table-item">
                    <div class="schema-table-header" onclick="insertTableQuery('${t.table_name}')">
                        <span>${t.table_name}</span>
                        <span style="font-size: 10px; color: var(--ig-text-secondary);">${t.row_count} rows</span>
                    </div>
                    <div class="schema-cols-list">
                        ${t.columns.map(c => `
                            <div class="schema-col-row">
                                <span class="${c.pk ? 'col-pk' : ''}">${c.pk ? '[PK] ' : ''}${c.name}</span>
                                <span>${c.type}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading schema:", err);
    }
}

function insertTableQuery(tableName) {
    if (sqlQueryInput) {
        sqlQueryInput.value = `SELECT * FROM ${tableName} LIMIT 25;`;
        handleExecuteSql();
    }
}

async function handleExecuteSql() {
    const query = sqlQueryInput.value.trim();
    if (!query) {
        alert("Please write a SQL statement to execute.");
        return;
    }

    if (sqlExecutionStatus) sqlExecutionStatus.textContent = "RUNNING";
    runSqlQueryBtn.disabled = true;

    try {
        const res = await fetch("/api/sql/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });

        const data = await res.json();
        lastSqlResults = data;

        if (data.success) {
            if (sqlExecutionStatus) sqlExecutionStatus.textContent = "SUCCESS";
            if (executionTimeBadge) {
                executionTimeBadge.style.display = "inline-block";
                executionTimeBadge.textContent = `${data.execution_time_ms}ms`;
            }
            if (resultsMetaText) resultsMetaText.textContent = `${data.message || `${data.row_count} row(s) returned`}`;

            renderSqlResultsTable(data.columns, data.rows);
        } else {
            if (sqlExecutionStatus) sqlExecutionStatus.textContent = "ERROR";
            if (executionTimeBadge) {
                executionTimeBadge.style.display = "inline-block";
                executionTimeBadge.textContent = `${data.execution_time_ms}ms`;
            }
            if (resultsMetaText) resultsMetaText.textContent = `Query error`;

            sqlResultsContainer.innerHTML = `
                <div class="sql-error-banner">
                    <strong>QUERY ERROR:</strong><br>
                    ${escapeHTML(data.error || "Database error occurred.")}
                </div>
            `;
        }
    } catch (err) {
        sqlResultsContainer.innerHTML = `<div class="sql-error-banner">${err.message}</div>`;
    } finally {
        runSqlQueryBtn.disabled = false;
    }
}

function renderSqlResultsTable(columns, rows) {
    if (!rows || rows.length === 0) {
        sqlResultsContainer.innerHTML = `
            <div class="sql-placeholder-box">
                Query executed successfully. (0 rows returned)
            </div>
        `;
        return;
    }

    const tableHtml = `
        <table class="sql-data-table">
            <thead>
                <tr>
                    <th>#</th>
                    ${columns.map(col => `<th>${col}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${rows.map((row, idx) => `
                    <tr>
                        <td style="color: var(--ig-text-muted);">${idx + 1}</td>
                        ${columns.map(col => `<td>${formatCellValue(row[col])}</td>`).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    sqlResultsContainer.innerHTML = tableHtml;
}

function formatCellValue(val) {
    if (val === null || val === undefined) return `<em style="color: var(--ig-text-muted);">NULL</em>`;
    if (typeof val === "object") return escapeHTML(JSON.stringify(val));
    return escapeHTML(String(val));
}

function exportResultsAsCsv() {
    if (!lastSqlResults || !lastSqlResults.rows || lastSqlResults.rows.length === 0) {
        alert("No query results to export.");
        return;
    }
    const cols = lastSqlResults.columns;
    const csvRows = [cols.join(",")];

    lastSqlResults.rows.forEach(r => {
        const vals = cols.map(c => {
            let cell = r[c] === null ? "" : String(r[c]);
            cell = cell.replace(/"/g, '""');
            return `"${cell}"`;
        });
        csvRows.push(vals.join(","));
    });

    downloadBlob(csvRows.join("\n"), "socialsphere_export.csv", "text/csv");
}

function exportResultsAsJson() {
    if (!lastSqlResults || !lastSqlResults.rows || lastSqlResults.rows.length === 0) {
        alert("No query results to export.");
        return;
    }
    downloadBlob(JSON.stringify(lastSqlResults.rows, null, 2), "socialsphere_export.json", "application/json");
}

function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 10. Analytics & Telemetry
async function loadAnalyticsData() {
    if (!analyticsGrid) return;
    try {
        const res = await fetch("/api/analytics/overview");
        const data = await res.json();
        if (data.success && data.analytics) {
            const a = data.analytics;
            const metrics = [
                { label: "Total Users", count: a.totalUsers, code: "USR" },
                { label: "User Credentials", count: a.totalCreds || a.totalUsers, code: "CRD" },
                { label: "Regular Users", count: a.totalRegular, code: "REG" },
                { label: "Admins", count: a.totalAdmin, code: "ADM" },
                { label: "Feed Posts", count: a.totalPosts, code: "PST" },
                { label: "Comments", count: a.totalComments, code: "CMT" },
                { label: "Reactions", count: a.totalReactions, code: "RCT" },
                { label: "Direct Messages", count: a.totalMessages, code: "MSG" },
                { label: "Communities", count: a.totalGroups, code: "GRP" },
                { label: "Memberships", count: a.totalMemberships, code: "MBR" },
                { label: "Hashtags", count: a.totalHashtags, code: "TAG" },
                { label: "Tagged Posts", count: a.totalTaggedPosts, code: "PTG" },
                { label: "Recommendations", count: a.totalRecommendations, code: "REC" },
                { label: "Notifications", count: a.totalNotifications, code: "NTF" },
                { label: "Events Tracked", count: a.totalEvents, code: "EVT" },
                { label: "Profile Avatars", count: a.totalPics, code: "PIC" }
            ];

            analyticsGrid.innerHTML = metrics.map(m => `
                <div class="stat-metric-card">
                    <div class="stat-info-wrap">
                        <h4>${m.label}</h4>
                        <div class="stat-huge-number">${m.count}</div>
                    </div>
                    <div class="stat-big-icon">${m.code}</div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading analytics:", err);
    }

    try {
        const res = await fetch("/api/analytics/events?limit=25");
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
                            <th>PAYLOAD</th>
                            <th>TIMESTAMP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.events.map(e => `
                            <tr>
                                <td>#${e.event_id}</td>
                                <td><strong>${e.username}</strong></td>
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
        console.error("Error loading telemetry events:", err);
    }
}

// 11. Platform Directory
function renderUsersDirectory() {
    if (!usersGrid) return;
    usersGrid.innerHTML = usersCache.map(u => `
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
            <button class="btn-insta-primary" style="width: 100%;" onclick="startDirectChat(${u.user_id})">
                Message
            </button>
        </div>
    `).join("");
}

// 12. Notifications
async function checkNotifications() {
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
