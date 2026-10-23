import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { auth, googleProvider } from "./firebase.js";

// HTML elements
const authView = document.getElementById("authView");
const userView = document.getElementById("userView");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authMessage = document.getElementById("authMessage");
const userMessage = document.getElementById("userMessage");

function showMessage(element, message, type = "error") {
  element.textContent = message;
  element.className = `message show ${type}`;
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.className = "message";
  userMessage.textContent = "";
  userMessage.className = "message";
}

function setLoading(button, loading, text) {
  button.disabled = loading;
  button.textContent = loading ? "Please wait..." : text;
}

function showLogin() {
  clearMessage();
  loginPanel.classList.remove("hidden");
  registerPanel.classList.add("hidden");
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
}

function showRegister() {
  clearMessage();
  registerPanel.classList.remove("hidden");
  loginPanel.classList.add("hidden");
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

// Register with email and password
document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const button = document.getElementById("registerBtn");

  if (password !== confirmPassword) {
    showMessage(authMessage, "Passwords do not match.");
    return;
  }

  setLoading(button, true, "Create Account");

  try {
    const result = await createUserWithEmailAndPassword(
      auth, email, password
    );

    await updateProfile(result.user, {
      displayName: name
    });

    showMessage(authMessage, "Account created successfully!", "success");
  } catch (error) {
    showMessage(authMessage, friendlyError(error));
  } finally {
    setLoading(button, false, "Create Account");
  }
});

// Login with email and password
document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const button = document.getElementById("loginBtn");

  setLoading(button, true, "Sign In");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showMessage(authMessage, friendlyError(error));
  } finally {
    setLoading(button, false, "Sign In");
  }
});

// Google sign-in
async function googleSignIn(button) {
  clearMessage();
  setLoading(button, true, "Connecting to Google...");

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showMessage(authMessage, friendlyError(error));
  } finally {
    button.disabled = false;
    button.textContent =
      button.id === "googleRegisterBtn"
        ? "Sign up with Google"
        : "Continue with Google";
  }
}

document.getElementById("googleBtn").addEventListener("click", function () {
  googleSignIn(this);
});

document.getElementById("googleRegisterBtn").addEventListener("click", function () {
  googleSignIn(this);
});

// Password reset
document.getElementById("forgotBtn").addEventListener("click", async () => {
  clearMessage();

  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    showMessage(authMessage, "Enter your email address first.");
    document.getElementById("loginEmail").focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(
      authMessage,
      "If an account exists for that email, a password reset email will be sent.",
      "success"
    );
  } catch (error) {
    showMessage(authMessage, friendlyError(error));
  }
});

// Sign out
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showMessage(userMessage, friendlyError(error));
  }
});

// Update the screen when login state changes
onAuthStateChanged(auth, (user) => {
  clearMessage();

  if (user) {
    authView.classList.add("hidden");
    userView.classList.remove("hidden");

    document.getElementById("userGreeting").textContent =
      `Welcome, ${user.displayName || "User"}!`;

    document.getElementById("userEmail").textContent =
      user.email || "Signed in with your account";

    document.getElementById("userAvatar").textContent =
      (user.displayName || user.email || "B").charAt(0).toUpperCase();
  } else {
    authView.classList.remove("hidden");
    userView.classList.add("hidden");
  }
});

// Convert common Firebase errors into readable messages
function friendlyError(error) {
  const messages = {
    "auth/invalid-email": "That email address is not valid.",
    "auth/user-not-found": "No matching account was found.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "That email is already registered.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in popup.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase.",
    "auth/operation-not-allowed": "Enable this sign-in method in Firebase Console.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/too-many-requests": "Too many attempts. Try again later."
  };

  return messages[error.code] ||
    error.message ||
    "Something went wrong. Please try again.";
}
