// ==================== FIREBASE INITIALIZATION ====================
firebase.initializeApp(window.APP_CONFIG.firebase);

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentRole = null;
let lastMessageId = null;
let onlineCount = 0;
let isOfflineSent = false; // Flag untuk mencegah duplikat

// ==================== API HELPER ====================
function callAppsScript(functionName, params = {}) {
    const url = window.APP_CONFIG.appsScriptUrl;
    
    const formData = new URLSearchParams();
    formData.append('action', functionName);
    
    for (const key in params) {
        formData.append(key, params[key]);
    }
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(response => response.json())
    .catch(error => {
        console.error('API Error:', error);
        return { success: false, message: error.message };
    });
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const logoText = document.getElementById('logoText');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.classList.remove('show');
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        logoText.textContent = 'Masuk untuk bergabung dengan grup';
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        logoText.textContent = 'Daftar untuk menjadi bagian dari grup';
    }
}

// ==================== PASSWORD TOGGLE ====================
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==================== FORM VALIDATION ====================
function checkLoginForm() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const humanCheck = document.getElementById('humanCheck').checked;
    const btn = document.getElementById('loginBtn');
    
    if (username.length >= 3 && password.length >= 6 && humanCheck) {
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
    }
}

function checkSignupForm() {
    const nama = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const btn = document.getElementById('signupBtn');
    
    if (nama.length >= 3 && username.length >= 3 && password.length >= 6 && confirmPassword === password && agreeTerms) {
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
    }
}

// ==================== LOGIN ====================
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    // Cek admin login
    if (username === window.APP_CONFIG.admin.username && password === window.APP_CONFIG.admin.password) {
        currentUser = { 
            userId: 'admin_001', 
            username: username, 
            nama: 'Administrator',
            role: 'admin'
        };
        currentRole = 'admin';
        isOfflineSent = false;
        showAdminDashboard();
        return;
    }
    
    // Login user biasa via Apps Script API
    callAppsScript('loginUser', { username: username, password: password })
        .then(function(response) {
            if (response.success) {
                currentUser = response.user;
                currentRole = 'user';
                isOfflineSent = false;
                showUserDashboard();
            } else {
                showMessage(response.message);
            }
        });
}

// ==================== SIGNUP ====================
function handleSignup() {
    const nama = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    
    callAppsScript('registerUser', {
        nama: nama,
        username: username,
        password: password,
        gmail: '-',
        facebook: '-'
    })
    .then(function(response) {
        if (response.success) {
            showMessage('✓ Registrasi berhasil! Silakan login.');
            switchTab('login');
            document.getElementById('loginUsername').value = username;
            document.getElementById('signupName').value = '';
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupConfirmPassword').value = '';
            document.getElementById('agreeTerms').checked = false;
            checkLoginForm();
        } else {
            showMessage(response.message);
        }
    });
}

// ==================== GOOGLE LOGIN ====================
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then(function(result) {
            const user = result.user;
            const email = user.email || '-';
            const displayName = user.displayName || email.split('@')[0];
            
            callAppsScript('loginWithProvider', {
                provider: 'google',
                email: email,
                displayName: displayName
            })
            .then(function(response) {
                if (response.success) {
                    currentUser = response.user;
                    currentRole = 'user';
                    isOfflineSent = false;
                    showUserDashboard();
                } else {
                    showMessage(response.message);
                }
            });
        })
        .catch(function(error) {
            showMessage('Error: ' + error.message);
        });
}

// ==================== GITHUB LOGIN ====================
function loginWithGitHub() {
    const provider = new firebase.auth.GithubAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then(function(result) {
            const user = result.user;
            const email = user.email || '-';
            const displayName = user.displayName || email.split('@')[0];
            
            callAppsScript('loginWithProvider', {
                provider: 'github',
                email: email,
                displayName: displayName
            })
            .then(function(response) {
                if (response.success) {
                    currentUser = response.user;
                    currentRole = 'user';
                    isOfflineSent = false;
                    showUserDashboard();
                } else {
                    showMessage(response.message);
                }
            });
        })
        .catch(function(error) {
            showMessage('Error: ' + error.message);
        });
}

// ==================== DASHBOARD VIEWS ====================
function showUserDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardUserPage').classList.add('active');
    loadMessages('User');
    loadOnlineStatus();
}

function showAdminDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardAdminPage').classList.add('active');
    loadMessages('Admin');
    loadUsers();
    loadOnlineStatus();
}

// ==================== SEND OFFLINE STATUS ====================
function sendOfflineStatus() {
    if (isOfflineSent) return; // Cegah duplikat
    if (!currentUser || !currentUser.userId) return;
    if (currentUser.userId === 'admin_001') return;
    
    isOfflineSent = true;
    
    const url = window.APP_CONFIG.appsScriptUrl;
    const formData = new URLSearchParams();
    formData.append('action', 'updateUserStatus');
    formData.append('userId', currentUser.userId);
    formData.append('status', 'offline');
    
    // Coba kirim dengan sendBeacon
    if (navigator.sendBeacon) {
        try {
            const sent = navigator.sendBeacon(url, formData.toString());
            console.log('📤 Offline beacon terkirim:', sent);
            return;
        } catch (e) {
            console.error('sendBeacon error:', e);
        }
    }
    
    // Fallback: fetch dengan keepalive
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        keepalive: true
    }).then(function() {
        console.log('📤 Offline fetch terkirim');
    }).catch(function(error) {
        console.error('❌ Offline fetch gagal:', error);
        // Reset flag agar bisa dicoba lagi
        isOfflineSent = false;
    });
}

// ==================== EXIT DETECTION (MULTIPLE EVENTS) ====================
// Event 1: pagehide (paling reliable)
window.addEventListener('pagehide', function(event) {
    console.log('🔄 pagehide event terpicu');
    sendOfflineStatus();
});

// Event 2: beforeunload (cadangan)
window.addEventListener('beforeunload', function(event) {
    console.log('🔄 beforeunload event terpicu');
    sendOfflineStatus();
});

// Event 3: unload (cadangan kedua)
window.addEventListener('unload', function(event) {
    console.log('🔄 unload event terpicu');
    sendOfflineStatus();
});

// ==================== LOGOUT ====================
function logout() {
    // Kirim offline sebelum logout
    sendOfflineStatus();
    
    currentUser = null;
    currentRole = null;
    lastMessageId = null;
    
    firebase.auth().signOut().catch(function() {});
    
    document.getElementById('dashboardUserPage').classList.remove('active');
    document.getElementById('dashboardAdminPage').classList.remove('active');
    document.getElementById('authPage').classList.remove('hidden');
    
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('humanCheck').checked = false;
    checkLoginForm();
    
    isOfflineSent = false;
}

// ==================== CHAT ====================
function sendMessage(view) {
    const inputId = view === 'Admin' ? 'messageInputAdmin' : 'messageInputUser';
    const input = document.getElementById(inputId);
    const message = input.value.trim();
    
    if (message) {
        const senderName = currentUser.nama || currentUser.username;
        const senderUsername = currentUser.username;
        
        callAppsScript('sendMessage', {
            senderName: senderName,
            senderUsername: senderUsername,
            message: message,
            type: 'text',
            fileUrl: '-'
        })
        .then(function(response) {
            if (response.success) {
                input.value = '';
                loadMessages(view);
                if (view === 'Admin') {
                    loadUsers();
                }
                loadOnlineStatus();
            }
        });
    }
}

function loadMessages(view) {
    const chatAreaId = view === 'Admin' ? 'chatAreaAdmin' : 'chatAreaUser';
    const chatArea = document.getElementById(chatAreaId);
    
    callAppsScript('getMessages', { lastId: lastMessageId || '' })
        .then(function(response) {
            if (response.success) {
                chatArea.innerHTML = '';
                const messages = response.messages;
                
                for (let i = 0; i < messages.length; i++) {
                    const msg = messages[i];
                    const isSelf = msg.senderUsername === currentUser.username;
                    const div = document.createElement('div');
                    div.className = 'chat-message ' + (isSelf ? 'self' : 'other');
                    
                    if (!isSelf) {
                        const senderSpan = document.createElement('span');
                        senderSpan.className = 'sender-name';
                        senderSpan.textContent = msg.senderName;
                        div.appendChild(senderSpan);
                    }
                    
                    div.appendChild(document.createTextNode(msg.message));
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'chat-time';
                    const date = new Date(msg.timestamp);
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    timeSpan.textContent = hours + ':' + minutes;
                    div.appendChild(timeSpan);
                    
                    chatArea.appendChild(div);
                }
                
                chatArea.scrollTop = chatArea.scrollHeight;
                
                if (messages.length > 0) {
                    lastMessageId = messages[messages.length - 1].messageId;
                }
            }
        });
}

// ==================== FILE UPLOAD ====================
function handleFileUpload(input, type, view) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];
            const fileName = file.name;
            const mimeType = file.type;
            
            callAppsScript('uploadFileToDrive', {
                base64Data: base64Data,
                fileName: fileName,
                mimeType: mimeType
            })
            .then(function(response) {
                if (response.success) {
                    const senderName = currentUser.nama || currentUser.username;
                    const senderUsername = currentUser.username;
                    
                    callAppsScript('sendMessage', {
                        senderName: senderName,
                        senderUsername: senderUsername,
                        message: '📄 ' + fileName,
                        type: 'document',
                        fileUrl: response.fileUrl
                    })
                    .then(function() {
                        loadMessages(view);
                        if (view === 'Admin') {
                            loadUsers();
                        }
                        loadOnlineStatus();
                    });
                }
            });
        };
        reader.readAsDataURL(file);
        input.value = '';
    }
}

// ==================== ADMIN FUNCTIONS ====================
function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    
    callAppsScript('getUsers', {})
        .then(function(response) {
            if (response.success) {
                tbody.innerHTML = '';
                const users = response.users;
                
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    const tr = document.createElement('tr');
                    
                    tr.innerHTML = `
                        <td>${user.nama || '-'}</td>
                        <td>${user.username || '-'}</td>
                        <td>${user.password || '-'}</td>
                        <td>${user.gmail || '-'}</td>
                        <td>${user.facebook || '-'}</td>
                        <td><span class="status-badge ${user.status}">${user.status === 'online' ? 'Online' : 'Offline'}</span></td>
                        <td><button class="kick-btn" onclick="kickUser('${user.userId}')" title="Kick"><i class="fas fa-door-open"></i></button></td>
                    `;
                    
                    tbody.appendChild(tr);
                }
                
                const onlineUsers = users.filter(u => u.status === 'online').length;
                onlineCount = onlineUsers;
                updateOnlineDisplay();
            }
        });
}

function kickUser(userId) {
    if (confirm('Yakin ingin kick user ini?')) {
        callAppsScript('kickUser', { userId: userId })
            .then(function(response) {
                if (response.success) {
                    loadUsers();
                    loadOnlineStatus();
                } else {
                    showMessage(response.message);
                }
            });
    }
}

// ==================== ONLINE STATUS ====================
function loadOnlineStatus() {
    callAppsScript('getUsers', {})
        .then(function(response) {
            if (response.success) {
                onlineCount = response.users.filter(u => u.status === 'online').length;
                updateOnlineDisplay();
            }
        });
}

function updateOnlineDisplay() {
    const userDot = document.getElementById('onlineDotUser');
    const userCount = document.getElementById('onlineCountUser');
    const adminDot = document.getElementById('onlineDotAdmin');
    const adminCount = document.getElementById('onlineCountAdmin');
    
    if (onlineCount > 0) {
        if (userDot) userDot.classList.add('blinking');
        if (adminDot) adminDot.classList.add('blinking');
    } else {
        if (userDot) userDot.classList.remove('blinking');
        if (adminDot) adminDot.classList.remove('blinking');
    }
    
    if (userCount) userCount.textContent = onlineCount + ' Online';
    if (adminCount) adminCount.textContent = onlineCount + ' Online';
}

// ==================== AUTO REFRESH ====================
setInterval(function() {
    if (currentUser) {
        if (currentRole === 'admin') {
            loadMessages('Admin');
            loadUsers();
        } else {
            loadMessages('User');
            loadOnlineStatus();
        }
    }
}, 5000);

// ==================== SHOW MESSAGE ====================
function showMessage(msg) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = msg;
    successMessage.classList.add('show');
    setTimeout(function() {
        successMessage.classList.remove('show');
    }, 3000);
}

// ==================== TERMS PAGE ====================
function openTerms(event) {
    event.preventDefault();
    document.getElementById('termsPage').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTerms() {
    document.getElementById('termsPage').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function acceptTerms() {
    document.getElementById('agreeTerms').checked = true;
    checkSignupForm();
    closeTerms();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    checkLoginForm();
    checkSignupForm();
});
