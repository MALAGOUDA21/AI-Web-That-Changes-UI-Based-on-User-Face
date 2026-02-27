// ==========================================
// LOGIN SYSTEM - Authentication & Forgot Password
// ==========================================

console.log("🔐 Login system initialized");

// Demo credentials - Replace with backend API in production
const DEMO_USERS = {
  'user': 'pass123',
  'admin': 'admin123',
  'demo': 'demo'
};

// Check if user is already logged in (from session storage)
window.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = sessionStorage.getItem('userLoggedIn');
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  
  if (isLoggedIn === 'true' && loggedInUser) {
    console.log(`✓ User ${loggedInUser} already logged in`);
    showApp();
  } else {
    console.log("🔐 Waiting for login");
    showLoginPage();
  }
});

// ==========================================
// LOGIN HANDLER
// ==========================================
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  
  console.log(`Attempting login for: ${username}`);
  
  // Validate credentials
  if (DEMO_USERS[username] === password) {
    console.log(`✓✓ Login SUCCESSFUL for ${username}`);
    
    // Store in session
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.setItem('loggedInUser', username);
    sessionStorage.setItem('loginTime', new Date().toLocaleString());
    
    errorDiv.style.display = 'none';
    
    // Show app after short delay
    setTimeout(() => {
      showApp();
    }, 500);
    
  } else {
    console.log(`❌ Login FAILED for ${username}`);
    errorDiv.innerHTML = "❌ Invalid username or password";
    errorDiv.style.display = 'block';
    
    // Clear password field
    document.getElementById('password').value = '';
  }
}

// ==========================================
// FORGOT PASSWORD HANDLER
// ==========================================
function showForgotPassword() {
  document.getElementById('forgot-password-modal').style.display = 'block';
  console.log("Opened forgot password modal");
}

function closeForgotPassword() {
  document.getElementById('forgot-password-modal').style.display = 'none';
  document.getElementById('forgot-form').reset();
  document.getElementById('forgot-message').style.display = 'none';
}

function handleForgotPassword(event) {
  event.preventDefault();
  
  const recoveryInput = document.getElementById('recover-email').value.trim();
  const messageDiv = document.getElementById('forgot-message');
  
  console.log(`Password reset requested for: ${recoveryInput}`);
  
  // Check if user exists
  if (DEMO_USERS.hasOwnProperty(recoveryInput)) {
    const password = DEMO_USERS[recoveryInput];
    
    messageDiv.innerHTML = `✓ Password reset link sent! Your password is: <strong>${password}</strong>`;
    messageDiv.className = 'success-message';
    messageDiv.style.display = 'block';
    
    console.log(`✓ Reset email sent to ${recoveryInput}`);
    
    // Auto-close modal after 3 seconds
    setTimeout(() => {
      closeForgotPassword();
    }, 3000);
    
  } else {
    messageDiv.innerHTML = `❌ User "${recoveryInput}" not found. Try: user, admin, or demo`;
    messageDiv.className = 'error-message';
    messageDiv.style.display = 'block';
    console.log(`❌ User not found: ${recoveryInput}`);
  }
}

// ==========================================
// LOGOUT HANDLER
// ==========================================
function handleLogout() {
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  
  // Clear session
  sessionStorage.clear();
  localStorage.clear();
  
  console.log(`🔐 User ${loggedInUser} logged out`);
  
  // Reset forms
  document.getElementById('login-form').reset();
  document.getElementById('forgot-form').reset();
  
  // Show login page
  showLoginPage();
}

// ==========================================
// UI HELPERS
// ==========================================
function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app-container').classList.add('app-hidden');
  document.getElementById('username').focus();
}

function showApp() {
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-container').classList.remove('app-hidden');
  
  console.log(`🎉 Welcome ${loggedInUser}!`);
  console.log("📱 Face detection app ready");
  
  // Initialize the face detection app
  if (window.initializeApp) {
    window.initializeApp();
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('forgot-password-modal');
  if (event.target === modal) {
    closeForgotPassword();
  }
};

// Console commands for debugging
window.loginDebug = function() {
  console.log("=== LOGIN DEBUG ===");
  console.log("Logged in:", sessionStorage.getItem('userLoggedIn'));
  console.log("Current user:", sessionStorage.getItem('loggedInUser'));
  console.log("Login time:", sessionStorage.getItem('loginTime'));
  console.log("Demo users:", Object.keys(DEMO_USERS));
};

console.log("💡 Demo credentials: user/pass123, admin/admin123, demo/demo");
console.log("💡 Debug: Type loginDebug() in console");
