// ==================== FIREBASE INITIALIZATION ====================
firebase.initializeApp(window.APP_CONFIG.firebase);

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentRole = null; // 'admin' atau 'user'
let lastMessageId = null;
let onlineCount = 0;

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
        currentUser = { username: username, nama: 'Administrator' };
        currentRole = 'admin';
        showAdminDashboard();
        return;
    }
    
    // Login user biasa via Apps Script
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                currentUser = response.user;
                currentRole = 'user';
                saveSession(response.user);
                showUserDashboard();
            } else {
                showMessage(response.message);
            }
        })
        .withFailureHandler(function(error) {
            showMessage('Error: ' + error.message);
        })
        .loginUser(username, password);
}

// ==================== SIGNUP ====================
function handleSignup() {
    const nama = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                showMessage('✓ Registrasi berhasil! Silakan login.');
                switchTab('login');
                document.getElementById('loginUsername').value = username;
                document.getElementById('signupName').value = '';
                document.getElementById('signupUsername').value = '';
                document.getElementById('signupPassword').value = '';
                document.getElementById('signupConfirmPassword').value = '';
                document.getElementById('agreeTerms').checked = false;
            } else {
                showMessage(response.message);
            }
        })
        .withFailureHandler(function(error) {
            showMessage('Error: ' + error.message);
        })
        .registerUser(nama, username, password, '-', '-');
}

// ==================== GOOGLE LOGIN ====================
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then(function(result) {
            const user = result.user;
            const email = user.email;
            const displayName = user.displayName || email.split('@')[0];
            
            // Simpan ke Apps Script
            google.script.run
                .withSuccessHandler(function(response) {
                    if (response.success) {
                        currentUser = response.user;
                        currentRole = 'user';
                        saveSession(response.user);
                        showUserDashboard();
                    }
                })
                .loginWithProvider('google', email, displayName);
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
            const email = user.email || user.providerData[0].email || '-';
            const displayName = user.displayName || user.providerData[0].displayName || 'GitHub User';
            
            google.script.run
                .withSuccessHandler(function(response) {
                    if (response.success) {
                        currentUser = response.user;
                        currentRole = 'user';
                        saveSession(response.user);
                        showUserDashboard();
                    }
                })
                .loginWithProvider('github', email, displayName);
        })
        .catch(function(error) {
            showMessage('Error: ' + error.message);
        });
}

// ==================== SESSION MANAGEMENT ====================
function saveSession(user) {
    localStorage.setItem('anonymousGroupUser', JSON.stringify(user));
    localStorage.setItem('anonymousGroupRole', currentRole);
}

function loadSession() {
    const savedUser = localStorage.getItem('anonymousGroupUser');
    const savedRole = localStorage.getItem('anonymousGroupRole');
    
    if (savedUser && savedRole) {
        currentUser = JSON.parse(savedUser);
        currentRole = savedRole;
        
        if (currentRole === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
}

// ==================== DASHBOARD VIEWS ====================
function showUserDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardUserPage').classList.add('active');
    loadMessages('User');
    loadOnlineStatus('User');
}

function showAdminDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardAdminPage').classList.add('active');
    loadMessages('Admin');
    loadUsers();
    loadOnlineStatus('Admin');
}

// ==================== CHAT ====================
function sendMessage(view) {
    const inputId = view === 'Admin' ? 'messageInputAdmin' : 'messageInputUser';
    const chatAreaId = view === 'Admin' ? 'chatAreaAdmin' : 'chatAreaUser';
    const input = document.getElementById(inputId);
    const message = input.value.trim();
    
    if (message) {
        const senderName = currentUser.nama || currentUser.username;
        const senderUsername = currentUser.username;
        
        google.script.run
            .withSuccessHandler(function(response) {
                if (response.success) {
                    input.value = '';
                    loadMessages(view);
                    if (view === 'Admin') loadUsers();
                }
            })
            .sendMessage(senderName, senderUsername, message, 'text', '-');
    }
}

function loadMessages(view) {
    const chatAreaId = view === 'Admin' ? 'chatAreaAdmin' : 'chatAreaUser';
    const chatArea = document.getElementById(chatAreaId);
    
    google.script.run
        .withSuccessHandler(function(response) {
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
                    timeSpan.textContent = date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
                    div.appendChild(timeSpan);
                    
                    chatArea.appendChild(div);
                }
                
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        })
        .getMessages(lastMessageId);
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
            
            google.script.run
                .withSuccessHandler(function(response) {
                    if (response.success) {
                        const senderName = currentUser.nama || currentUser.username;
                        const senderUsername = currentUser.username;
                        
                        google.script.run
                            .withSuccessHandler(function(msgResponse) {
                                loadMessages(view);
                                if (view === 'Admin') loadUsers();
                            })
                            .sendMessage(senderName, senderUsername, '📄 ' + fileName, 'document', response.fileUrl);
                    }
                })
                .uploadFileToDrive(base64Data, fileName, mimeType);
        };
        reader.readAsDataURL(file);
        input.value = '';
    }
}

// ==================== ADMIN FUNCTIONS ====================
function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                tbody.innerHTML = '';
                const users = response.users;
                
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    const tr = document.createElement('tr');
                    
                    tr.innerHTML = `
                        <td>${user.nama}</td>
                        <td>${user.username}</td>
                        <td>${user.password}</td>
                        <td>${user.gmail}</td>
                        <td>${user.facebook}</td>
                        <td><span class="status-badge ${user.status}">${user.status === 'online' ? 'Online' : 'Offline'}</span></td>
                        <td><button class="kick-btn" onclick="kickUser('${user.userId}')" title="Kick"><i class="fas fa-door-open"></i></button></td>
                    `;
                    
                    tbody.appendChild(tr);
                }
                
                // Update online count
                const onlineUsers = users.filter(u => u.status === 'online').length;
                onlineCount = onlineUsers;
                updateOnlineDisplay();
            }
        })
        .getUsers();
}

function kickUser(userId) {
    if (confirm('Yakin ingin kick user ini?')) {
        google.script.run
            .withSuccessHandler(function() {
                loadUsers();
            })
            .kickUser(userId);
    }
}

// ==================== ONLINE STATUS ====================
function loadOnlineStatus(view) {
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                onlineCount = response.users.filter(u => u.status === 'online').length;
                updateOnlineDisplay();
            }
        })
        .getUsers();
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
            loadOnlineStatus('User');
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

// ==================== TERMS PAGE (STUB) ====================
function openTerms(event) {
    event.preventDefault();
    alert('Syarat & Ketentuan akan ditampilkan di sini.');
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    loadSession();
});