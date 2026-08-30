// ==================== FIREBASE INITIALIZATION ====================
firebase.initializeApp(window.APP_CONFIG.firebase);

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentRole = null;
let onlineCount = 0;
let onlinePingInterval = null;

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
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const humanCheck = document.getElementById('humanCheck');
    const btn = document.getElementById('loginBtn');
    
    if (!usernameInput || !passwordInput || !humanCheck || !btn) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username.length >= 3 && password.length >= 6 && humanCheck.checked) {
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
    }
}

function checkSignupForm() {
    const namaInput = document.getElementById('signupName');
    const usernameInput = document.getElementById('signupUsername');
    const passwordInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const agreeTerms = document.getElementById('agreeTerms');
    const btn = document.getElementById('signupBtn');
    
    if (!namaInput || !usernameInput || !passwordInput || !confirmInput || !agreeTerms || !btn) return;
    
    const nama = namaInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();
    
    if (nama.length >= 3 && username.length >= 3 && password.length >= 6 && confirmPassword === password && agreeTerms.checked) {
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
    }
}

// ==================== LOGIN ====================
function handleLogin() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Cek admin login
    if (username === window.APP_CONFIG.admin.username && password === window.APP_CONFIG.admin.password) {
        currentUser = { 
            userId: 'admin_001', 
            username: 'Admin', 
            nama: window.APP_CONFIG.admin.displayName || 'Admin group',
            role: 'admin',
            photoUrl: window.APP_CONFIG.admin.photoUrl
        };
        currentRole = 'admin';
        showAdminDashboard();
        return;
    }
    
    // Login user biasa via Apps Script API
    callAppsScript('loginUser', { username: username, password: password })
        .then(function(response) {
            if (response.success) {
                currentUser = response.user;
                currentRole = 'user';
                showUserDashboard();
                startOnlinePing();
            } else {
                showMessage(response.message);
            }
        });
}

// ==================== SIGNUP ====================
function handleSignup() {
    const namaInput = document.getElementById('signupName');
    const usernameInput = document.getElementById('signupUsername');
    const passwordInput = document.getElementById('signupPassword');
    
    if (!namaInput || !usernameInput || !passwordInput) return;
    
    const nama = namaInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
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
                    showUserDashboard();
                    startOnlinePing();
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
                    showUserDashboard();
                    startOnlinePing();
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

// ==================== ONLINE PING SYSTEM ====================
function startOnlinePing() {
    stopOnlinePing();
    
    sendOnlinePing();
    
    onlinePingInterval = setInterval(function() {
        sendOnlinePing();
    }, 5000);
}

function sendOnlinePing() {
    if (currentUser && currentUser.userId && currentUser.userId !== 'admin_001') {
        callAppsScript('updateUserStatus', {
            userId: currentUser.userId,
            status: 'online'
        }).then(function(response) {
            if (!response.success) {
                console.error('Ping gagal:', response.message);
            }
        });
    }
}

function stopOnlinePing() {
    if (onlinePingInterval) {
        clearInterval(onlinePingInterval);
        onlinePingInterval = null;
    }
}

// ==================== LOGOUT ====================
function logout() {
    stopOnlinePing();
    
    if (currentUser && currentUser.userId && currentUser.userId !== 'admin_001') {
        callAppsScript('updateUserStatus', {
            userId: currentUser.userId,
            status: 'offline'
        });
    }
    
    currentUser = null;
    currentRole = null;
    
    firebase.auth().signOut().catch(function() {});
    
    document.getElementById('dashboardUserPage').classList.remove('active');
    document.getElementById('dashboardAdminPage').classList.remove('active');
    document.getElementById('authPage').classList.remove('hidden');
    
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('humanCheck').checked = false;
    checkLoginForm();
}

// ==================== HELPER: ADMIN IDENTITY ====================
function getAdminIdentity() {
    return {
        senderName: window.APP_CONFIG.admin.displayName || 'Admin group',
        senderUsername: 'Admin',
        photoUrl: window.APP_CONFIG.admin.photoUrl || ''
    };
}

// ==================== CHAT ====================
function sendMessage(view) {
    const inputId = view === 'Admin' ? 'messageInputAdmin' : 'messageInputUser';
    const input = document.getElementById(inputId);
    
    if (!input) return;
    
    const message = input.value.trim();
    
    if (message) {
        let senderName;
        let senderUsername;
        
        if (view === 'Admin') {
            const adminIdentity = getAdminIdentity();
            senderName = adminIdentity.senderName;
            senderUsername = adminIdentity.senderUsername;
        } else {
            senderName = currentUser.nama || currentUser.username;
            senderUsername = currentUser.username;
        }
        
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

// ==================== LOAD MESSAGES (FIXED - Foto Admin di Semua View) ====================
function loadMessages(view) {
    const chatAreaId = view === 'Admin' ? 'chatAreaAdmin' : 'chatAreaUser';
    const chatArea = document.getElementById(chatAreaId);
    
    if (!chatArea) return;
    
    callAppsScript('getMessages', {})
        .then(function(response) {
            if (response.success) {
                chatArea.innerHTML = '';
                const messages = response.messages;
                
                for (let i = 0; i < messages.length; i++) {
                    const msg = messages[i];
                    const isSelf = currentUser && msg.senderUsername === currentUser.username;
                    const div = document.createElement('div');
                    div.className = 'chat-message ' + (isSelf ? 'self' : 'other');
                    
                    if (!isSelf) {
                        const senderSpan = document.createElement('span');
                        senderSpan.className = 'sender-name';
                        senderSpan.textContent = msg.senderName || msg.senderUsername;
                        
                        // Jika sender adalah admin, tambahkan foto
                        if (msg.senderUsername === 'Admin' && window.APP_CONFIG.admin.photoUrl) {
                            const adminImg = document.createElement('img');
                            adminImg.src = window.APP_CONFIG.admin.photoUrl;
                            adminImg.className = 'sender-photo';
                            adminImg.alt = 'Admin';
                            adminImg.style.width = '14px';
                            adminImg.style.height = '14px';
                            adminImg.style.objectFit = 'cover';
                            adminImg.style.display = 'inline-block';
                            adminImg.style.verticalAlign = 'middle';
                            adminImg.style.marginLeft = '6px';
                            senderSpan.appendChild(adminImg);
                        }
                        
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
                    let senderName;
                    let senderUsername;
                    
                    if (view === 'Admin') {
                        const adminIdentity = getAdminIdentity();
                        senderName = adminIdentity.senderName;
                        senderUsername = adminIdentity.senderUsername;
                    } else {
                        senderName = currentUser.nama || currentUser.username;
                        senderUsername = currentUser.username;
                    }
                    
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
    
    if (!tbody) return;
    
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
    if (!successMessage) return;
    
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
