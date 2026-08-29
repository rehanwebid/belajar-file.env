// ==================== KONFIGURASI ====================
const SPREADSHEET_ID = '1Nbi5laaRcxEdW3S1ZMq8XcR0cmn8KVi-o_xfZwITxF4';

// Admin credentials
const ADMIN_USERNAME = 'Admin.env';
const ADMIN_PASSWORD = '19o0';

// Nama Sheet
const SHEET_USERS = 'Users';
const SHEET_MESSAGES = 'Messages';
const SHEET_SETTINGS = 'Settings';

// ==================== SETUP OTOMATIS ====================
function setupSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    let usersSheet = ss.getSheetByName(SHEET_USERS);
    if (!usersSheet) {
      usersSheet = ss.insertSheet(SHEET_USERS);
    }
    if (usersSheet.getLastRow() === 0) {
      usersSheet.getRange('A1:J1').setValues([[
        'userId', 'nama', 'username', 'password', 'gmail', 
        'facebook', 'status', 'role', 'createdAt', 'lastLogin'
      ]]);
    }
    usersSheet.setFrozenRows(1);
    usersSheet.getRange('A1:J1').setFontWeight('bold');
    usersSheet.getRange('A1:J1').setBackground('#ccff00');
    usersSheet.getRange('A1:J1').setFontColor('#000000');
    
    let messagesSheet = ss.getSheetByName(SHEET_MESSAGES);
    if (!messagesSheet) {
      messagesSheet = ss.insertSheet(SHEET_MESSAGES);
    }
    if (messagesSheet.getLastRow() === 0) {
      messagesSheet.getRange('A1:G1').setValues([[
        'messageId', 'senderName', 'senderUsername', 'message', 
        'type', 'fileUrl', 'timestamp'
      ]]);
    }
    messagesSheet.setFrozenRows(1);
    messagesSheet.getRange('A1:G1').setFontWeight('bold');
    messagesSheet.getRange('A1:G1').setBackground('#ccff00');
    messagesSheet.getRange('A1:G1').setFontColor('#000000');
    
    let settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet(SHEET_SETTINGS);
    }
    if (settingsSheet.getLastRow() === 0) {
      settingsSheet.getRange('A1:B1').setValues([['key', 'value']]);
    }
    settingsSheet.setFrozenRows(1);
    settingsSheet.getRange('A1:B1').setFontWeight('bold');
    settingsSheet.getRange('A1:B1').setBackground('#ccff00');
    settingsSheet.getRange('A1:B1').setFontColor('#000000');
    
    return 'Setup berhasil!';
  } catch (error) {
    return 'Error: ' + error.toString();
  }
}

// ==================== DOGET & DOPOST ====================
function doGet(e) {
  setupSheets();
  return HtmlService.createHtmlOutput('API Ready');
}

function doPost(e) {
  try {
    setupSheets();
    
    if (!e || !e.parameter) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, message: 'Invalid request'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = e.parameter.action;
    const result = handleAction(action, e.parameter);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAction(action, params) {
  switch(action) {
    case 'loginUser':
      return loginUser(params.username, params.password);
    case 'registerUser':
      return registerUser(params.nama, params.username, params.password, params.gmail, params.facebook);
    case 'loginWithProvider':
      return loginWithProvider(params.provider, params.email, params.displayName);
    case 'sendMessage':
      return sendMessage(params.senderName, params.senderUsername, params.message, params.type, params.fileUrl);
    case 'getMessages':
      return getMessages(params.lastId || '');
    case 'getUsers':
      return getUsers();
    case 'kickUser':
      return kickUser(params.userId);
    case 'updateUserStatus':
      return updateUserStatus(params.userId, params.status);
    case 'uploadFileToDrive':
      return uploadFileToDrive(params.base64Data, params.fileName, params.mimeType);
    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}

// ==================== HELPER FUNCTIONS ====================
function generateId(prefix) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return prefix + '_' + timestamp + '_' + random;
}

function getTimestamp() {
  return new Date().toISOString();
}

function getSheetByName(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

// ==================== AUTO OFFLINE CHECK ====================
function autoOfflineCheck(usersSheet) {
  try {
    const data = usersSheet.getDataRange().getValues();
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][6];
      const lastLogin = data[i][9];
      
      if (status === 'online' && lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const diffSeconds = (now - lastLoginDate) / 1000;
        
        // Jika tidak ada ping dalam 10 detik, set offline
        if (diffSeconds > 10) {
          usersSheet.getRange(i + 1, 7).setValue('offline');
        }
      }
    }
  } catch (error) {
    console.error('Error autoOfflineCheck: ' + error.toString());
  }
}

// ==================== AUTH FUNCTIONS ====================
function loginUser(username, password) {
  try {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return {
        success: true,
        user: {
          userId: 'admin_001',
          nama: 'Administrator',
          username: ADMIN_USERNAME,
          role: 'admin'
        }
      };
    }
    
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: false, message: 'Sheet Users belum dibuat' };
    
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === username && data[i][3] === password) {
        usersSheet.getRange(i + 1, 7).setValue('online');
        usersSheet.getRange(i + 1, 10).setValue(getTimestamp());
        
        return {
          success: true,
          user: {
            userId: data[i][0],
            nama: data[i][1],
            username: data[i][2],
            password: data[i][3],
            gmail: data[i][4],
            facebook: data[i][5],
            status: 'online',
            role: data[i][7]
          }
        };
      }
    }
    
    return { success: false, message: 'Username atau password salah' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function registerUser(nama, username, password, gmail, facebook) {
  try {
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: false, message: 'Sheet Users belum dibuat' };
    
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toLowerCase() === username.toLowerCase()) {
        return { success: false, message: 'Username sudah digunakan' };
      }
    }
    
    const userId = generateId('usr');
    const timestamp = getTimestamp();
    
    usersSheet.appendRow([
      userId, nama || '-', username, password, gmail || '-', 
      facebook || '-', 'offline', 'user', timestamp, timestamp
    ]);
    
    return { success: true, message: 'Registrasi berhasil', userId: userId };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function loginWithProvider(provider, email, displayName) {
  try {
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: false, message: 'Sheet Users belum dibuat' };
    
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] && data[i][4].toLowerCase() === email.toLowerCase()) {
        usersSheet.getRange(i + 1, 7).setValue('online');
        usersSheet.getRange(i + 1, 10).setValue(getTimestamp());
        
        return {
          success: true,
          user: {
            userId: data[i][0],
            nama: data[i][1],
            username: data[i][2],
            gmail: data[i][4],
            facebook: data[i][5],
            role: data[i][7]
          }
        };
      }
    }
    
    const userId = generateId('usr');
    const timestamp = getTimestamp();
    const username = displayName ? displayName.replace(/\s+/g, '_').toLowerCase() : 'user_' + Date.now();
    
    usersSheet.appendRow([
      userId, displayName || '-', username, '-', email || '-',
      provider === 'facebook' ? displayName : '-', 'online', 'user', timestamp, timestamp
    ]);
    
    return {
      success: true,
      user: {
        userId: userId,
        nama: displayName,
        username: username,
        gmail: email,
        role: 'user'
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==================== CHAT FUNCTIONS ====================
function sendMessage(senderName, senderUsername, message, type, fileUrl) {
  try {
    const messagesSheet = getSheetByName(SHEET_MESSAGES);
    if (!messagesSheet) return { success: false, message: 'Sheet Messages belum dibuat' };
    
    const messageId = generateId('msg');
    const timestamp = getTimestamp();
    
    messagesSheet.appendRow([
      messageId, senderName || senderUsername, senderUsername, 
      message || '', type || 'text', fileUrl || '-', timestamp
    ]);
    
    return { success: true, message: 'Pesan terkirim', messageId: messageId };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getMessages(lastId) {
  try {
    const messagesSheet = getSheetByName(SHEET_MESSAGES);
    if (!messagesSheet) return { success: true, messages: [] };
    
    const data = messagesSheet.getDataRange().getValues();
    const messages = [];
    
    for (let i = 1; i < data.length; i++) {
      const msg = {
        messageId: data[i][0],
        senderName: data[i][1],
        senderUsername: data[i][2],
        message: data[i][3],
        type: data[i][4],
        fileUrl: data[i][5],
        timestamp: data[i][6]
      };
      
      if (!lastId || msg.messageId > lastId) {
        messages.push(msg);
      }
    }
    
    return { success: true, messages: messages };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==================== ADMIN FUNCTIONS ====================
function getUsers() {
  try {
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: true, users: [] };
    
    // Auto check offline sebelum ambil data
    autoOfflineCheck(usersSheet);
    
    const data = usersSheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      users.push({
        userId: data[i][0],
        nama: data[i][1],
        username: data[i][2],
        password: data[i][3],
        gmail: data[i][4],
        facebook: data[i][5],
        status: data[i][6],
        role: data[i][7],
        createdAt: data[i][8],
        lastLogin: data[i][9]
      });
    }
    
    return { success: true, users: users };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function kickUser(userId) {
  try {
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: false, message: 'Sheet Users belum dibuat' };
    
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        usersSheet.deleteRow(i + 1);
        return { success: true, message: 'User berhasil di-kick' };
      }
    }
    return { success: false, message: 'User tidak ditemukan' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateUserStatus(userId, status) {
  try {
    const usersSheet = getSheetByName(SHEET_USERS);
    if (!usersSheet) return { success: false, message: 'Sheet Users belum dibuat' };
    
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        usersSheet.getRange(i + 1, 7).setValue(status);
        usersSheet.getRange(i + 1, 10).setValue(getTimestamp());
        return { success: true, message: 'Status diupdate' };
      }
    }
    return { success: false, message: 'User tidak ditemukan' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==================== FILE UPLOAD ====================
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const folderName = 'Anonymous Group Uploads';
    const folders = DriveApp.getFoldersByName(folderName);
    let folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, fileUrl: file.getUrl(), fileName: fileName };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
