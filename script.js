import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

let app, db;
try {
    const firebaseConfig = {
        apiKey: "AIzaSyBh6ksJhbijU9UGTqQjJrg7Pmj51pGxD70",
        authDomain: "hexenmeister-c729a.firebaseapp.com",
        databaseURL: "https://hexenmeister-c729a-default-rtdb.firebaseio.com",
        projectId: "hexenmeister-c729a",
        storageBucket: "hexenmeister-c729a.firebasestorage.app",
        messagingSenderId: "109414203696",
        appId: "1:109414203696:web:c95bcb88f039cff6f888f5",
        measurementId: "G-FNXVV1VEWL"
    };
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    document.getElementById("status").textContent = "Firebase error: Check console for details";
}

// Audio Player
let currentAudio = null;
let currentSongName = "";
let currentCover = "";

window.playSong = function(audioUrl, songName, coverUrl) {
    if (!audioUrl) {
        document.getElementById("status").textContent = "Error: Select a song";
        return;
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = document.getElementById("volume-slider").value / 100;
    currentCover = coverUrl;
    currentAudio.play().then(() => {
        const miniPlayer = document.getElementById("mini-player");
        miniPlayer.classList.add("show");
        currentSongName = songName;
        const artistMatch = songName.match(/^([^-\s]+)\s*-/);
        const artist = artistMatch ? artistMatch[1] : "Unknown";
        document.getElementById("current-song").textContent = songName;
        document.getElementById("current-artist").textContent = artist;
        document.getElementById("mini-album-cover").src = currentCover;
        document.getElementById("status").textContent = `Playing: ${songName}`;
        document.getElementById("play-pause-btn").textContent = "Pause";
        currentAudio.addEventListener("timeupdate", updateProgress);
        currentAudio.addEventListener("ended", stopSong);
    }).catch(error => {
        console.error("Audio playback failed:", error);
        document.getElementById("status").textContent = "Audio error: Check console";
    });
};

window.togglePlayPause = function() {
    if (!currentAudio) {
        document.getElementById("status").textContent = "No audio to play";
        return;
    }
    if (currentAudio.paused) {
        currentAudio.play();
        document.getElementById("play-pause-btn").textContent = "Pause";
        document.getElementById("status").textContent = `Playing: ${currentSongName}`;
    } else {
        currentAudio.pause();
        document.getElementById("play-pause-btn").textContent = "Play";
        document.getElementById("status").textContent = `Paused: ${currentSongName}`;
    }
};

window.rewind = function() {
    if (currentAudio) {
        currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
    }
};

window.fastForward = function() {
    if (currentAudio) {
        currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
    }
};

window.stopSong = function() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        currentSongName = "";
        currentCover = "";
        const miniPlayer = document.getElementById("mini-player");
        miniPlayer.classList.remove("show");
        document.getElementById("current-song").textContent = "";
        document.getElementById("current-artist").textContent = "";
        document.getElementById("mini-album-cover").src = "";
        document.getElementById("play-pause-btn").textContent = "Play";
        document.getElementById("progress-bar").value = 0;
        document.getElementById("status").textContent = "";
        document.getElementById("duration").textContent = "00:00 / 00:00";
    }
};

window.seek = function() {
    const progressBar = document.getElementById("progress-bar");
    if (currentAudio && !isNaN(currentAudio.duration)) {
        currentAudio.currentTime = (progressBar.value / 100) * currentAudio.duration;
    }
};

window.adjustVolume = function() {
    const volumeSlider = document.getElementById("volume-slider");
    if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100;
    }
};

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    const progressBar = document.getElementById("progress-bar");
    const durationDisplay = document.getElementById("duration");
    if (currentAudio && !isNaN(currentAudio.duration)) {
        progressBar.value = (currentAudio.currentTime / currentAudio.duration) * 100;
        const current = formatTime(currentAudio.currentTime);
        const total = formatTime(currentAudio.duration);
        durationDisplay.textContent = `${current} / ${total}`;
    }
}

// Comments
window.submitComment = async function() {
    const commentText = document.querySelector(".comment-form textarea").value.trim();
    const username = document.querySelector(".comment-form input[type='text']").value.trim() || "Anonymous";
    if (!commentText) {
        alert("Please enter a comment.");
        return;
    }
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    try {
        await addDoc(collection(db, "comments"), { text: commentText, timestamp, username });
        document.querySelector(".comment-form textarea").value = "";
        document.querySelector(".comment-form input[type='text']").value = "";
        document.getElementById("status").textContent = "Comment submitted successfully";
        setTimeout(() => document.getElementById("status").textContent = "", 3000);
    } catch (error) {
        console.error("Error submitting comment:", error);
        alert("Error submitting comment: " + error.message);
    }
};

function displayComments() {
    const commentList = document.getElementById("comment-list");
    const commentsQuery = query(collection(db, "comments"), orderBy("timestamp", "desc"));
    onSnapshot(commentsQuery, (snapshot) => {
        commentList.innerHTML = "";
        if (snapshot.empty) {
            commentList.innerHTML = "<p>No comments yet.</p>";
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "comment";
            div.innerHTML = `<span class="username">${data.username}</span><p>${data.text}</p><span class="timestamp">${data.timestamp}</span>`;
            commentList.appendChild(div);
        });
    }, (error) => {
        console.error("Error fetching comments:", error);
        commentList.innerHTML = "<p>Error loading comments: " + error.message + "</p>";
    });
}

// Edit Request Modal
window.showEditRequestModal = function(albumTitle = null) {
    console.log("Opening modal for album:", albumTitle || "New Album");
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);

    const isEdit = albumTitle && typeof albumTitle === "string" && albumTitle.trim() !== "";
    console.log("Is edit mode:", isEdit);

    const modal = document.createElement("div");
    modal.className = "edit-request-modal";
    modal.innerHTML = `
        <h3>${isEdit ? `Request Edit for "${albumTitle}"` : "Request New Album"}</h3>
        <select id="editField" onchange="toggleEditFields()" required>
            <option value="" disabled selected>Select action</option>
            ${isEdit ? `
                <option value="title">Title</option>
                <option value="year">Year</option>
                <option value="label">Label</option>
                <option value="format">Format</option>
                <option value="artists">Artists</option>
                <option value="tracks">Tracks</option>
                <option value="download">Download Link</option>
            ` : ""}
            <option value="new_album">Add New Album</option>
        </select>
        <div id="editFields" class="${isEdit ? "" : "hidden"}">
            <input type="text" id="currentValue" placeholder="Current value (optional)" maxlength="100">
            <textarea id="proposedChange" placeholder="Proposed change" required></textarea>
        </div>
        <div id="newAlbumFields" class="${isEdit ? "hidden" : ""}">
            <input type="text" id="newTitle" placeholder="Album title" maxlength="100">
            <input type="text" id="newYear" placeholder="Year (e.g., 2023)" maxlength="4">
            <input type="text" id="newLabel" placeholder="Label" maxlength="100">
            <input type="text" id="newFormat" placeholder="Format (e.g., Cassette)" maxlength="100">
            <input type="text" id="newArtists" placeholder="Artists (e.g., Hexenmeister)" maxlength="100">
            <textarea id="newTracks" placeholder="Tracks (one per line)"></textarea>
            <input type="text" id="newDownload" placeholder="Download link (optional)" maxlength="200">
        </div>
        <input type="text" id="editUsername" placeholder="Your username (optional)" maxlength="20">
        <button onclick="submitEditRequest('${albumTitle || ""}')">Submit</button>
        <button onclick="closeModal()">Cancel</button>
    `;
    document.body.appendChild(modal);
    document.getElementById("editField").focus();
};

window.toggleEditFields = function() {
    const field = document.getElementById("editField").value;
    const editFields = document.getElementById("editFields");
    const newAlbumFields = document.getElementById("newAlbumFields");
    if (field === "new_album") {
        editFields.classList.add("hidden");
        newAlbumFields.classList.remove("hidden");
        document.getElementById("newTitle").focus();
    } else {
        editFields.classList.remove("hidden");
        newAlbumFields.classList.add("hidden");
        document.getElementById("currentValue").focus();
    }
};

window.submitEditRequest = async function(albumTitle) {
    const field = document.getElementById("editField").value;
    const username = document.getElementById("editUsername").value.trim() || "Anonymous";
    if (!field) {
        alert("Please select an action.");
        return;
    }
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    let requestData = {
        type: "edit_request",
        albumTitle: albumTitle || "New Album Request",
        field: field,
        username: username,
        timestamp: timestamp,
        status: "pending"
    };
    try {
        if (field === "new_album") {
            const newTitle = document.getElementById("newTitle").value.trim();
            const newYear = document.getElementById("newYear").value.trim();
            const newLabel = document.getElementById("newLabel").value.trim();
            const newFormat = document.getElementById("newFormat").value.trim();
            const newArtists = document.getElementById("newArtists").value.trim();
            const newTracks = document.getElementById("newTracks").value.trim();
            const newDownload = document.getElementById("newDownload").value.trim();
            if (!newTitle || !newYear || !newLabel || !newFormat) {
                alert("Please provide title, year, label, and format for the new album.");
                return;
            }
            requestData.proposedChange = {
                title: newTitle,
                year: newYear,
                label: newLabel,
                format: newFormat,
                artists: newArtists,
                tracks: newTracks,
                download: newDownload
            };
        } else {
            const currentValue = document.getElementById("currentValue").value.trim();
            const proposedChange = document.getElementById("proposedChange").value.trim();
            if (!proposedChange) {
                alert("Please provide a proposed change.");
                return;
            }
            requestData.currentValue = currentValue;
            requestData.proposedChange = proposedChange;
        }
        await addDoc(collection(db, "requests"), requestData);
        alert("Request submitted successfully! It will be reviewed by an administrator.");
        closeModal();
    } catch (error) {
        console.error("Error submitting edit request:", error);
        alert("Error submitting request: " + error.message);
    }
};

window.closeModal = function() {
    const overlay = document.querySelector(".overlay");
    const modal = document.querySelector(".edit-request-modal") || document.querySelector(".news-request-modal");
    if (overlay) overlay.remove();
    if (modal) modal.remove();
};

// News Section
function displayNews() {
    const newsList = document.getElementById("news-list");
    const newsQuery = query(collection(db, "news"), orderBy("timestamp", "desc"));
    onSnapshot(newsQuery, (snapshot) => {
        newsList.innerHTML = "";
        if (snapshot.empty) {
            newsList.innerHTML = "<p>No news yet.</p>";
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "news-item";
            div.innerHTML = `
                <span class="title">${data.title}</span>
                <span class="date">${data.timestamp}</span>
                <p>${data.text}</p>
            `;
            newsList.appendChild(div);
        });
    }, (error) => {
        console.error("Error fetching news:", error);
        newsList.innerHTML = "<p>Error loading news: " + error.message + "</p>";
    });
}

window.showAddNewsModal = function() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);

    const modal = document.createElement("div");
    modal.className = "news-request-modal";
    modal.innerHTML = `
        <h3>Request New Update</h3>
        <input type="text" id="newsTitle" placeholder="News title" maxlength="100" required>
        <textarea id="newsText" placeholder="News content" required></textarea>
        <input type="text" id="newsUsername" placeholder="Your username (optional)" maxlength="20">
        <button onclick="submitNewsRequest()">Submit</button>
        <button onclick="closeModal()">Cancel</button>
    `;
    document.body.appendChild(modal);
    document.getElementById("newsTitle").focus();
};

window.submitNewsRequest = async function() {
    const title = document.getElementById("newsTitle").value.trim();
    const text = document.getElementById("newsText").value.trim();
    const username = document.getElementById("newsUsername").value.trim() || "Anonymous";
    if (!title || !text) {
        alert("Please provide a title and content for the news update.");
        return;
    }
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const requestData = {
        type: "news_request",
        title: title,
        text: text,
        username: username,
        timestamp: timestamp,
        status: "pending"
    };
    try {
        await addDoc(collection(db, "requests"), requestData);
        alert("News request submitted successfully! It will be reviewed by an administrator.");
        closeModal();
    } catch (error) {
        console.error("Error submitting news request:", error);
        alert("Error submitting request: " + error.message);
    }
};

// Language Popup
window.showLanguagePopup = function() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);
    const popup = document.createElement("div");
    popup.className = "language-popup";
    popup.innerHTML = `
        <h3>Select Language</h3>
        <select id="langSelect">
            <option value="index.html">English</option>
            <option value="indexru.html">Русский (Russian)</option>
            <option value="indexgerman.html">Deutsch (German)</option>
            <option value="indexuk.html">Українська (Ukrainian)</option>
        </select>
        <button onclick="setLanguage()">Confirm</button>
    `;
    document.body.appendChild(popup);
    const savedLanguage = localStorage.getItem("selectedLanguage") || "index.html";
    document.getElementById("langSelect").value = savedLanguage;
    document.getElementById("langSelect").focus();
};

window.setLanguage = function() {
    const langSelect = document.getElementById("langSelect");
    const lang = langSelect.value;
    if (!lang) {
        alert("Please select a language.");
        return;
    }
    localStorage.setItem("selectedLanguage", lang);
    const overlay = document.querySelector(".overlay");
    const popup = document.querySelector(".language-popup");
    if (overlay) overlay.remove();
    if (popup) popup.remove();
    if (window.location.pathname.split("/").pop() !== lang) {
        window.location.href = lang;
    }
};

window.debugSettingsClick = function() {
    window.showLanguagePopup();
};

// Admin Inbox
let isAdminAuthenticated = false;
const ADMIN_PASSWORD = "trvekvltbabypowder";

window.toggleAdminInbox = function() {
    if (!isAdminAuthenticated) {
        console.log("Prompting for admin password");
        const overlay = document.createElement("div");
        overlay.className = "overlay";
        document.body.appendChild(overlay);

        const prompt = document.createElement("div");
        prompt.className = "password-prompt";
        prompt.innerHTML = `
            <h3>Enter Admin Password</h3>
            <input type="password" id="adminPassword" placeholder="Password">
            <button onclick="verifyAdminPassword()">Submit</button>
            <button onclick="closePasswordPrompt()">Cancel</button>
        `;
        document.body.appendChild(prompt);
        document.getElementById("adminPassword").focus();
    } else {
        toggleInboxVisibility();
    }
};

window.verifyAdminPassword = function() {
    const password = document.getElementById("adminPassword").value;
    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        console.log("Admin authenticated successfully");
        closePasswordPrompt();
        toggleInboxVisibility();
    } else {
        console.log("Admin authentication failed");
        alert("Incorrect password!");
    }
};

window.closePasswordPrompt = function() {
    const overlay = document.querySelector(".overlay");
    const prompt = document.querySelector(".password-prompt");
    if (overlay) overlay.remove();
    if (prompt) prompt.remove();
};

function toggleInboxVisibility() {
    const inbox = document.getElementById("admin-inbox");
    const button = document.querySelector(".toggle-inbox-btn");
    if (inbox.classList.contains("hidden")) {
        inbox.classList.remove("hidden");
        button.textContent = "Hide Admin Inbox";
        console.log("Displaying admin inbox");
        displayRequests();
    } else {
        inbox.classList.add("hidden");
        button.textContent = "Show Admin Inbox";
        console.log("Hiding admin inbox");
    }
}

function displayRequests() {
    const requestList = document.getElementById("request-list");
    requestList.innerHTML = "<p>Loading requests...</p>";
    const timeout = setTimeout(() => {
        if (requestList.innerHTML === "<p>Loading requests...</p>") {
            requestList.innerHTML = "<p>Error: Request loading timed out. Please try again.</p>";
        }
    }, 10000); // 10 seconds
    const requestsQuery = query(collection(db, "requests"), orderBy("timestamp", "desc"));
    onSnapshot(requestsQuery, (snapshot) => {
        clearTimeout(timeout);
        requestList.innerHTML = "";
        if (snapshot.empty) {
            requestList.innerHTML = "<p>No pending requests.</p>";
            return;
        }
        let hasPending = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "completed") return;
            hasPending = true;
            const div = document.createElement("div");
            div.className = "request-item";
            if (data.type === "edit_request") {
                div.innerHTML = `
                    <h3>${data.albumTitle}</h3>
                    <ul>
                        <li><span class="label">Type:</span> Edit Request</li>
                        <li><span class="label">Field:</span> ${data.field}</li>
                        <li><span class="label">Current Value:</span> ${data.currentValue || "N/A"}</li>
                        <li><span class="label">Proposed Change:</span> 
                            ${typeof data.proposedChange === "object" ? 
                                `<ul class="nested-list">` +
                                Object.entries(data.proposedChange).map(([key, value]) => 
                                    `<li><span class="label">${key}:</span> ${value || "N/A"}</li>`
                                ).join("") +
                                `</ul>` : data.proposedChange}
                        </li>
                        <li><span class="label">Username:</span> ${data.username}</li>
                        <li><span class="label">Timestamp:</span> ${data.timestamp}</li>
                        <li><span class="label">Status:</span> <span class="status">${data.status}</span></li>
                    </ul>
                    <button class="complete-btn" onclick="completeRequest('${doc.id}')">Complete</button>
                `;
            } else if (data.type === "news_request") {
                div.innerHTML = `
                    <h3>News Update Request</h3>
                    <ul>
                        <li><span class="label">Type:</span> News Request</li>
                        <li><span class="label">Title:</span> ${data.title}</li>
                        <li><span class="label">Content:</span> ${data.text}</li>
                        <li><span class="label">Username:</span> ${data.username}</li>
                        <li><span class="label">Timestamp:</span> ${data.timestamp}</li>
                        <li><span class="label">Status:</span> <span class="status">${data.status}</span></li>
                    </ul>
                    <button class="complete-btn" onclick="completeNewsRequest('${doc.id}')">Complete</button>
                `;
            }
            requestList.appendChild(div);
        });
        if (!hasPending) {
            requestList.innerHTML = "<p>No pending requests.</p>";
        }
    }, (error) => {
        clearTimeout(timeout);
        console.error("Error fetching requests:", error);
        requestList.innerHTML = "<p>Error loading requests: " + error.message + "</p>";
    });
}

window.completeRequest = async function(docId) {
    if (!docId) {
        console.error("Invalid document ID");
        alert("Error: Invalid request ID");
        return;
    }
    try {
        const requestRef = doc(db, "requests", docId);
        await updateDoc(requestRef, { status: "completed" });
        console.log(`Request ${docId} marked as completed`);
        document.getElementById("status").textContent = "Request completed successfully";
        setTimeout(() => document.getElementById("status").textContent = "", 3000);
        displayRequests();
    } catch (error) {
        console.error("Error completing request:", error);
        alert("Error completing request: " + error.message);
    }
};

window.completeNewsRequest = async function(docId) {
    if (!docId) {
        console.error("Invalid document ID");
        alert("Error: Invalid request ID");
        return;
    }
    try {
        const requestRef = doc(db, "requests", docId);
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.data();
        await addDoc(collection(db, "news"), {
            title: requestData.title,
            text: requestData.text,
            timestamp: requestData.timestamp,
            username: requestData.username
        });
        await updateDoc(requestRef, { status: "completed" });
        console.log(`News request ${docId} marked as completed and published`);
        document.getElementById("status").textContent = "News request completed and published successfully";
        setTimeout(() => document.getElementById("status").textContent = "", 3000);
        displayRequests();
    } catch (error) {
        console.error("Error completing news request:", error);
        alert("Error completing news request: " + error.message);
    }
};

// Navigation and Initialization
document.addEventListener("DOMContentLoaded", () => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (!savedLanguage) {
        window.showLanguagePopup();
    } else if (savedLanguage !== currentPage) {
        window.location.href = savedLanguage;
    }
    displayComments();
    displayNews();
    const hash = window.location.hash;
    if (hash === "#admin-inbox") {
        toggleAdminInbox();
    }
    window.addEventListener("hashchange", () => {
        const newHash = window.location.hash;
        if (newHash === "#admin-inbox") {
            toggleAdminInbox();
        } else {
            const inbox = document.getElementById("admin-inbox");
            const button = document.querySelector(".toggle-inbox-btn");
            inbox.classList.add("hidden");
            button.textContent = "Show Admin Inbox";
        }
    });
});