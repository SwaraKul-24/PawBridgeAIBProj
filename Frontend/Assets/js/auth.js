// auth.js - reusable sessionStorage auth handler

// Save logged-in user to sessionStorage
export function saveUser(user) {
    sessionStorage.setItem(`user_${user.rm_name}`, JSON.stringify(user));
}

// Get current user by role
export function getUser(role) {
    const data = sessionStorage.getItem(`user_${role}`);
    return data ? JSON.parse(data) : null;
}


// Get any user dynamically if needed
export function getCurrentUser() {
    // Try admin, user, ngo in order
    return getUser('admin') || getUser('user') || getUser('ngo/organisation');
}

// Remove a specific user
export function removeUser(role) {
    sessionStorage.removeItem(`user_${role}`);
}

// Logout function
export function logout(role, redirectUrl = '../../../landing.html#login') {
    removeUser(role);
    window.location.href = redirectUrl;
}
