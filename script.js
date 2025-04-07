// Cấu hình Firebase
// Khởi tạo biến cho dark mode và emoji picker
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentGroupId = 'public'; // ID nhóm chat mặc định
let currentUserProfile = null; // Thông tin hồ sơ người dùng hiện tại
const emojis = ['😀', '😂', '🥰', '😊', '😎', '😍', '🤔', '😴', '👍', '❤️', '🎉', '🌟', '💡', '📷', '🎵', '🎮'];

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCPJP7jkwP4d8lCjRiAjZrrX4dhvM-zx8g",
    authDomain: "chat2-31505.firebaseapp.com",
    databaseURL: "https://chat2-31505-default-rtdb.firebaseio.com",
    projectId: "chat2-31505",
    storageBucket: "chat2-31505.firebasestorage.app",
    messagingSenderId: "56305550816",
    appId: "1:56305550816:web:06b8c94d79cbc3de6c9785",
    measurementId: "G-MWDFB9XSYL"
};
// Khởi tạo Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Lấy các phần tử DOM
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authContainer = document.querySelector('.auth-container');
const chatContainer = document.querySelector('.chat-container');
const messagesDiv = document.querySelector('.messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const adminBtn = document.createElement('button');
adminBtn.classList.add('admin-btn');
adminBtn.innerHTML = '<i class="fas fa-cog"></i> Quản trị';
document.querySelector('.container').appendChild(adminBtn);
const emojiBtn = document.getElementById('emoji-btn');
const attachmentBtn = document.getElementById('attachment-btn');
const emojiPicker = document.getElementById('emoji-picker');
const createGroupBtn = document.getElementById('create-group-btn');
const createGroupModal = document.getElementById('create-group-modal');
const groupNameInput = document.getElementById('group-name-input');
const confirmCreateGroupBtn = document.getElementById('confirm-create-group');
const cancelCreateGroupBtn = document.getElementById('cancel-create-group');
const groupsList = document.getElementById('groups-list');
const currentChatName = document.getElementById('current-chat-name');
const groupInfoBtn = document.getElementById('group-info-btn');
const groupInfoModal = document.getElementById('group-info-modal');
const groupMembersList = document.getElementById('group-members-list');
const addMemberInput = document.getElementById('add-member-input');
const addMemberBtn = document.getElementById('add-member-btn');
const closeGroupInfoBtn = document.getElementById('close-group-info');
const loadingIndicator = document.createElement('div'); // Thêm chỉ báo tải

// Trang trí chỉ báo tải
loadingIndicator.classList.add('loading-indicator');
loadingIndicator.innerHTML = 'Đang tải...';
document.body.appendChild(loadingIndicator);

// Ẩn chỉ báo tải ban đầu
loadingIndicator.style.display = 'none';

// Kiểm tra xem tên hiển thị đã được lưu trữ chưa
const storedUsername = localStorage.getItem('username');
if (storedUsername) {
    usernameInput.value = storedUsername;
}

// Áp dụng dark mode nếu đã được lưu trữ
if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Xử lý chuyển đổi dark mode
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', isDarkMode);
});

// Khởi tạo emoji picker
function initEmojiPicker() {
    emojiPicker.innerHTML = '';
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.textContent = emoji;
        button.addEventListener('click', () => {
            messageInput.value += emoji;
            emojiPicker.classList.remove('active');
        });
        emojiPicker.appendChild(button);
    });
}

// Xử lý hiển thị/ẩn emoji picker
emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('active');
    if (emojiPicker.classList.contains('active')) {
        initEmojiPicker();
    }
});

// Xử lý file attachment
attachmentBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const storageRef = storage.ref(`attachments/${Date.now()}_${file.name}`);
            try {
                loadingIndicator.style.display = 'block';
                await storageRef.put(file);
                const url = await storageRef.getDownloadURL();
                database.ref('messages').push({
                    username: usernameInput.value || 'Ẩn danh',
                    type: 'image',
                    url: url,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            } catch (error) {
                console.error('Lỗi tải lên file:', error);
                alert('Lỗi tải lên file: ' + error.message);
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }
    };
    input.click();
});

// Hàm tạo avatar mặc định với chữ cái đầu và màu nền ngẫu nhiên
// Lưu trữ màu nền avatar cho mỗi người dùng
const userAvatarColors = {};

function createDefaultAvatar(username) {
  const firstChar = username ? username.charAt(0) : '?';
  const colors = [
    'var(--avatar-bg-1)',
    'var(--avatar-bg-2)',
    'var(--avatar-bg-3)',
    'var(--avatar-bg-4)',
    'var(--avatar-bg-5)',
    'var(--avatar-bg-6)'
  ];
  
  // Sử dụng màu đã lưu hoặc tạo màu mới
  if (!userAvatarColors[username]) {
    userAvatarColors[username] = colors[Math.floor(Math.random() * colors.length)];
  }
  
  return `<div class="message-avatar" style="background-color: ${userAvatarColors[username]}">${firstChar}</div>`;
}

// Khởi tạo modal danh sách người dùng
const usersModal = document.createElement('div');
usersModal.classList.add('users-modal');
usersModal.innerHTML = `
    <div class="users-modal-content">
        <div class="users-modal-header">
            <h3 class="users-modal-title">Danh sách người dùng</h3>
            <button class="close-users-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="users-list-container"></div>
    </div>
`;
document.body.appendChild(usersModal);

// Xử lý nút bạn bè
const friendsBtn = document.getElementById('add-friend-btn');
if (friendsBtn) {
    friendsBtn.addEventListener('click', () => {
        usersModal.classList.add('active');
        loadUsersList();
    });
}

// Đóng modal khi click nút đóng
const closeUsersModal = usersModal.querySelector('.close-users-modal');
closeUsersModal.addEventListener('click', () => {
    usersModal.classList.remove('active');
});

// Đóng modal khi click bên ngoài
usersModal.addEventListener('click', (e) => {
    if (e.target === usersModal) {
        usersModal.classList.remove('active');
    }
});

// Hàm tải danh sách người dùng
async function loadUsersList() {
    const usersListContainer = usersModal.querySelector('.users-list-container');
    usersListContainer.innerHTML = '';
    
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val();
    
    // Lấy danh sách lời mời kết bạn đã gửi và nhận
    const friendRequestsSnapshot = await database.ref('friendRequests').once('value');
    const friendRequests = friendRequestsSnapshot.val() || {};
    
    // Lấy danh sách bạn bè của người dùng hiện tại
    const friendsSnapshot = await database.ref(`friends/${auth.currentUser.uid}`).once('value');
    const friends = friendsSnapshot.val() || {};

    for (const [userId, user] of Object.entries(users)) {
        if (userId !== auth.currentUser.uid) {
            const userItem = document.createElement('div');
            userItem.classList.add('user-list-item');
            userItem.setAttribute('data-user-id', userId);
            
            // Kiểm tra lời mời kết bạn đã gửi
            const sentRequest = friendRequests[userId]?.[auth.currentUser.uid];
            // Kiểm tra lời mời kết bạn đã nhận
            const receivedRequest = friendRequests[auth.currentUser.uid]?.[userId];
            // Kiểm tra xem đã là bạn bè chưa
            const isFriend = friends[userId];
            
            let buttonHtml = '';
            
            if (isFriend) {
                // Đã là bạn bè
                buttonHtml = `<button class="friend-request-btn unfriend" data-user-id="${userId}">Hủy kết bạn</button>`;
            } else if (sentRequest?.status === 'pending') {
                // Đã gửi lời mời
                buttonHtml = `<button class="cancel-friend-request" data-user-id="${userId}">Hủy lời mời</button>`;
            } else if (receivedRequest?.status === 'pending') {
                // Nhận được lời mời
                buttonHtml = `
                    <div class="friend-request-actions">
                        <button class="accept-friend-request" data-user-id="${userId}">Đồng ý</button>
                        <button class="reject-friend-request" data-user-id="${userId}">Từ chối</button>
                    </div>
                `;
            } else {
                // Chưa có lời mời
                buttonHtml = `<button class="send-friend-request">Kết bạn</button>`;
            }
            
            userItem.innerHTML = `
                <div class="user-list-info">
                    <img src="${user.avatarUrl || 'https://via.placeholder.com/40'}" alt="${user.displayName}" class="user-list-avatar">
                    <span class="user-list-name">${user.displayName}</span>
                </div>
                ${buttonHtml}
            `;
            
            usersListContainer.appendChild(userItem);
            
            // Thêm event listeners cho các nút
            const sendRequestBtn = userItem.querySelector('.send-friend-request');
            const acceptBtn = userItem.querySelector('.accept-friend-request');
            const rejectBtn = userItem.querySelector('.reject-friend-request');
            const cancelRequestBtn = userItem.querySelector('.cancel-friend-request');
            
            if (sendRequestBtn) {
                sendRequestBtn.addEventListener('click', () => sendFriendRequest(userId));
            }
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', async () => {
                    try {
                        // Cập nhật trạng thái lời mời kết bạn thành 'accepted'
                        await database.ref(`friendRequests/${auth.currentUser.uid}/${userId}`).update({
                            status: 'accepted'
                        });
                        
                        // Thêm vào danh sách bạn bè của cả hai người dùng
                        await database.ref(`friends/${auth.currentUser.uid}/${userId}`).set({
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                        await database.ref(`friends/${userId}/${auth.currentUser.uid}`).set({
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                        
                        // Tải lại danh sách người dùng và bạn bè
                        loadUsersList();
                        loadFriendsList();
                        
                        // Hiển thị thông báo
                        const notification = document.createElement('div');
                        notification.classList.add('notification', 'success');
                        notification.textContent = 'Đã chấp nhận lời mời kết bạn!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                    } catch (error) {
                        console.error('Lỗi khi chấp nhận lời mời kết bạn:', error);
                    }
                });
            }
            
            if (rejectBtn) {
                rejectBtn.addEventListener('click', async () => {
                    try {
                        // Cập nhật trạng thái lời mời kết bạn thành 'rejected'
                        await database.ref(`friendRequests/${auth.currentUser.uid}/${userId}`).update({
                            status: 'rejected'
                        });
                        // Tải lại danh sách người dùng
                        loadUsersList();
                        // Hiển thị thông báo
                        const notification = document.createElement('div');
                        notification.classList.add('notification', 'success');
                        notification.textContent = 'Đã từ chối lời mời kết bạn!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                    } catch (error) {
                        console.error('Lỗi khi từ chối lời mời kết bạn:', error);
                    }
                });
            }

            if (cancelRequestBtn) {
                cancelRequestBtn.addEventListener('click', async () => {
                    try {
                        // Xóa lời mời kết bạn
                        await database.ref(`friendRequests/${userId}/${auth.currentUser.uid}`).remove();
                        // Tải lại danh sách người dùng
                        loadUsersList();
                        // Hiển thị thông báo
                        const notification = document.createElement('div');
                        notification.classList.add('notification', 'success');
                        notification.textContent = 'Đã hủy lời mời kết bạn!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                    } catch (error) {
                        console.error('Lỗi khi hủy lời mời kết bạn:', error);
                        const notification = document.createElement('div');
                        notification.classList.add('notification', 'error');
                        notification.textContent = 'Không thể hủy lời mời kết bạn: ' + error.message;
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                    }
                });
            }

            // Thêm event listener cho nút hủy kết bạn
            const unfriendBtn = userItem.querySelector('.unfriend');
            if (unfriendBtn) {
                unfriendBtn.addEventListener('click', () => unfriend(userId));
            }
        }
    }
}

// Hàm hủy kết bạn
async function unfriend(targetUserId) {
    try {
        // Xóa mối quan hệ bạn bè ở cả hai phía
        await database.ref(`friends/${auth.currentUser.uid}/${targetUserId}`).remove();
        await database.ref(`friends/${targetUserId}/${auth.currentUser.uid}`).remove();
        
        // Tải lại danh sách người dùng và bạn bè
        loadUsersList();
        loadFriendsList();
        
        // Hiển thị thông báo
        const notification = document.createElement('div');
        notification.classList.add('notification', 'success');
        notification.textContent = 'Đã hủy kết bạn!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    } catch (error) {
        console.error('Lỗi khi hủy kết bạn:', error);
        const notification = document.createElement('div');
        notification.classList.add('notification', 'error');
        notification.textContent = 'Không thể hủy kết bạn: ' + error.message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}



// Hàm gửi lời mời kết bạn
async function sendFriendRequest(targetUserId) {
    try {
        const requestRef = database.ref(`friendRequests/${targetUserId}/${auth.currentUser.uid}`);
        await requestRef.set({
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Cập nhật trạng thái nút
        const sendRequestBtn = document.querySelector(`.user-list-item[data-user-id="${targetUserId}"] .send-friend-request`);
        if (sendRequestBtn) {
            sendRequestBtn.textContent = 'Đã gửi lời mời';
            sendRequestBtn.classList.add('pending');
            sendRequestBtn.disabled = true;
        }

        // Hiển thị thông báo thành công
        const notification = document.createElement('div');
        notification.classList.add('notification', 'success');
        notification.textContent = 'Đã gửi lời mời kết bạn!';
        document.body.appendChild(notification);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
            notification.remove();
        }, 3000);

    } catch (error) {
        console.error('Lỗi khi gửi lời mời kết bạn:', error);
        
        // Hiển thị thông báo lỗi
        const notification = document.createElement('div');
        notification.classList.add('notification', 'error');
        notification.textContent = 'Không thể gửi lời mời kết bạn: ' + error.message;
        document.body.appendChild(notification);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Hàm tải danh sách bạn bè
async function loadFriendsList() {
    const friendsListContainer = document.querySelector('.friends-list');
    if (!friendsListContainer) return;

    friendsListContainer.innerHTML = '';
    
    try {
        // Lấy danh sách bạn bè của người dùng hiện tại
        const friendsSnapshot = await database.ref(`friends/${auth.currentUser.uid}`).once('value');
        const friends = friendsSnapshot.val() || {};
        
        // Lấy thông tin trạng thái online của tất cả người dùng
        const statusSnapshot = await database.ref('status').once('value');
        const onlineStatus = statusSnapshot.val() || {};
        
        // Lấy thông tin của tất cả người dùng
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val() || {};
        
        // Tạo Set để theo dõi ID bạn bè đã hiển thị
        const displayedFriends = new Set();
        
        // Lọc và sắp xếp danh sách bạn bè theo thời gian kết bạn
        const friendsList = Object.entries(friends)
            .filter(([friendId]) => {
                if (users[friendId] && !displayedFriends.has(friendId)) {
                    displayedFriends.add(friendId);
                    return true;
                }
                return false;
            })
            .sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        // Hiển thị từng người bạn
        for (const [friendId, friendData] of friendsList) {
            const friendInfo = users[friendId];
            if (friendInfo) {
                const isOnline = !!onlineStatus[friendId];
                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item', isOnline ? 'online' : 'offline');
                
                friendItem.innerHTML = `
                    <div class="friend-status-indicator ${isOnline ? 'online' : 'offline'}"></div>
                    <img src="${friendInfo.avatarUrl || 'https://via.placeholder.com/40'}" alt="${friendInfo.displayName}" class="friend-avatar">
                    <div class="friend-info">
                        <h4 class="friend-name">${friendInfo.displayName}</h4>
                        <span class="friend-status">${isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
                    </div>
                `;
                
                // Thêm sự kiện click để bắt đầu chat riêng
                friendItem.addEventListener('click', () => {
                    // Chuyển sang chế độ chat riêng với ID nhất quán
                    const ids = [auth.currentUser.uid, friendId].sort();
                    currentGroupId = `private_${ids[0]}_${ids[1]}`;
                    
                    // Cập nhật giao diện chat
                    const chatHeader = document.getElementById('chat-header');
                    chatHeader.innerHTML = `
                        <div class="private-chat-header">
                            <img src="${friendInfo.avatarUrl || 'https://via.placeholder.com/40'}" alt="${friendInfo.displayName}" class="private-chat-avatar">
                            <div class="private-chat-info">
                                <h3 class="private-chat-username">${friendInfo.displayName}</h3>
                                <div class="private-chat-status">
                                    <span class="status-indicator ${isOnline ? 'online' : 'offline'}"></span>
                                    <span>${isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Xóa tin nhắn cũ và tải tin nhắn mới
                    const messagesDiv = document.querySelector('.messages');
                    messagesDiv.innerHTML = '';
                    
                    // Lắng nghe tin nhắn mới
                    const chatRef = database.ref(`private_messages/${currentGroupId}`);
                    chatRef.off(); // Hủy lắng nghe cũ nếu có
                    chatRef.on('child_added', (snapshot) => {
                        const message = snapshot.val();
                        const messageElement = document.createElement('div');
                        messageElement.classList.add('message');
                        
                        // Kiểm tra xem tin nhắn là của ai
                        const isCurrentUser = message.userId === auth.currentUser.uid;
                        messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
                        
                        // Tạo nội dung tin nhắn
                        messageElement.innerHTML = `
                            ${createDefaultAvatar(message.username)}
                            <div class="message-content">
                                <div class="message-info">
                                    <span class="username">${message.username}</span>
                                    <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="message-text">${message.text}</div>
                            </div>
                        `;
                        
                        messagesDiv.appendChild(messageElement);
                        scrollToBottom();
                    });
                });
                
                // Cập nhật xử lý gửi tin nhắn
                sendBtn.onclick = () => {
                    const messageText = messageInput.value.trim();
                    if (messageText && currentGroupId) {
                        const isPrivateChat = currentGroupId.startsWith('private_');
                        const messageRef = database.ref(isPrivateChat ? `private_messages/${currentGroupId}` : 'messages');
                        
                        messageRef.push({
                            userId: auth.currentUser.uid,
                            username: usernameInput.value || 'Ẩn danh',
                            text: messageText,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                        
                        messageInput.value = '';
                    }
                };
                
                friendsListContainer.appendChild(friendItem);
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách bạn bè:', error);
    }
}

// Xử lý trạng thái online/offline
const userStatusRef = database.ref('status');
const connectedRef = database.ref('.info/connected');

connectedRef.on('value', (snap) => {
    if (snap.val() === true && auth.currentUser) {
        const statusRef = userStatusRef.child(auth.currentUser.uid);
        statusRef.set(true);
        statusRef.onDisconnect().remove();
        
        // Tải danh sách bạn bè khi kết nối thành công
        loadFriendsList();
    }
});

// Lắng nghe sự thay đổi trạng thái online/offline của bạn bè
userStatusRef.on('value', (snapshot) => {
    if (auth.currentUser) {
        loadFriendsList(); // Cập nhật danh sách bạn bè khi có thay đổi trạng thái
    }
});

// Xử lý đăng nhập
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    // Hiển thị chỉ báo tải
    loadingIndicator.style.display = 'block';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Đăng nhập thành công
            const user = userCredential.user;
            console.log('Đăng nhập thành công:', user);

            // Lưu tên hiển thị vào localStorage
            localStorage.setItem('username', usernameInput.value);

            // Tải thông tin hồ sơ người dùng
            loadUserProfile(user.uid);

            // Ẩn khung đăng nhập và hiển thị khung chat
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';

            // Hiển thị nút quản trị nếu là admin
            if (email === 'micovan108@gmail.com') {
                adminBtn.style.display = 'block';
            } else {
                adminBtn.style.display = 'none';
            }

            // Cuộn xuống tin nhắn cuối cùng
            scrollToBottom();
        })
        .catch((error) => {
            // Xử lý lỗi đăng nhập
            console.error('Lỗi đăng nhập:', error);
            alert('Lỗi đăng nhập: ' + error.message);
        })
        .finally(() => {
            // Ẩn chỉ báo tải
            loadingIndicator.style.display = 'none';
        });
});

// Xử lý đăng ký
signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const displayName = usernameInput.value;

    // Hiển thị chỉ báo tải
    loadingIndicator.style.display = 'block';

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Đăng ký thành công
            const user = userCredential.user;
            console.log('Đăng ký thành công:', user);

            // Tạo hồ sơ người dùng mới
            const userProfile = {
                displayName: displayName,
                email: email,
                avatarUrl: 'https://via.placeholder.com/150',
                bio: '',
                location: ''
            };

            // Lưu hồ sơ người dùng vào database
            database.ref(`users/${user.uid}`).set(userProfile);

            // Lưu tên hiển thị vào localStorage
            localStorage.setItem('username', displayName);

            // Cập nhật biến currentUserProfile
            currentUserProfile = userProfile;

            // Ẩn khung đăng ký và hiển thị khung chat
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';

            // Cập nhật giao diện hồ sơ
            updateProfileUI(userProfile);

            // Cuộn xuống tin nhắn cuối cùng
            scrollToBottom();
        })
        .catch((error) => {
            // Xử lý lỗi đăng ký
            console.error('Lỗi đăng ký:', error);
            alert('Lỗi đăng ký: ' + error.message);
        })
        .finally(() => {
            // Ẩn chỉ báo tải
            loadingIndicator.style.display = 'none';
        });
});

// Gửi tin nhắn
sendBtn.addEventListener('click', sendMessage);

// Gửi tin nhắn khi nhấn Enter
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Xử lý tạo nhóm chat mới
createGroupBtn.addEventListener('click', () => {
    createGroupModal.style.display = 'flex';
});

cancelCreateGroupBtn.addEventListener('click', () => {
    createGroupModal.style.display = 'none';
    groupNameInput.value = '';
});

confirmCreateGroupBtn.addEventListener('click', () => {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
        const groupRef = database.ref('groups').push();
        groupRef.set({
            name: groupName,
            createdBy: auth.currentUser.uid,
            members: {
                [auth.currentUser.uid]: true
            }
        });
        createGroupModal.style.display = 'none';
        groupNameInput.value = '';
    }
});

// Xử lý hiển thị thông tin nhóm
groupInfoBtn.addEventListener('click', () => {
    if (currentGroupId !== 'public') {
        showGroupInfo(currentGroupId);
        loadAvailableUsers();
        groupInfoModal.style.display = 'flex';
    }
});

// Xử lý chuyển đổi tab
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Xóa active class từ tất cả các tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        // Thêm active class cho tab được click
        button.classList.add('active');
        
        // Ẩn tất cả các tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Hiển thị tab content tương ứng
        const tabId = button.dataset.tab;
        document.getElementById(`${tabId}-tab`).style.display = 'block';
    });
});

// Biến để theo dõi trạng thái tab quản trị
let isAdminTabOpen = false;
let adminTab = null;
let adminTabBtn = null;

// Xử lý sự kiện click cho nút quản trị
adminBtn.addEventListener('click', () => {
    // Nếu tab quản trị chưa tồn tại, tạo mới
    if (!adminTab) {
        // Tạo nút tab
        adminTabBtn = document.createElement('button');
        adminTabBtn.classList.add('tab-btn');
        adminTabBtn.dataset.tab = 'admin';
        adminTabBtn.innerHTML = '<i class="fas fa-cog"></i> Quản trị';
        document.querySelector('.tabs').appendChild(adminTabBtn);

        // Tạo nội dung tab
        adminTab = document.createElement('div');
        adminTab.id = 'admin-tab';
        adminTab.classList.add('tab-content');
        adminTab.innerHTML = `
            <h2>Quản lý hệ thống</h2>
            <div class="admin-controls">
                <div class="admin-section">
                    <h3>Quản lý người dùng</h3>
                    <button class="admin-action-btn" id="list-users-btn">Danh sách người dùng</button>
                    <button class="admin-action-btn" id="block-user-btn">Khóa người dùng</button>
                </div>
                <div class="admin-section">
                    <h3>Quản lý nhóm</h3>
                    <button class="admin-action-btn" id="list-groups-btn">Danh sách nhóm</button>
                    <button class="admin-action-btn" id="delete-group-btn">Xóa nhóm</button>
                </div>
                <div class="admin-section">
                    <h3>Cài đặt hệ thống</h3>
                    <button class="admin-action-btn" id="general-settings-btn">Cấu hình chung</button>
                    <button class="admin-action-btn" id="backup-data-btn">Sao lưu dữ liệu</button>
                </div>
            </div>
        `;
        document.querySelector('.chat-container').appendChild(adminTab);

        // Thêm xử lý sự kiện cho các nút trong tab quản trị
        document.getElementById('list-users-btn').addEventListener('click', listUsers);
        document.getElementById('block-user-btn').addEventListener('click', blockUser);
        document.getElementById('list-groups-btn').addEventListener('click', listGroups);
        document.getElementById('delete-group-btn').addEventListener('click', deleteGroup);
        document.getElementById('general-settings-btn').addEventListener('click', generalSettings);
        document.getElementById('backup-data-btn').addEventListener('click', backupData);
    }

    // Chuyển đổi trạng thái hiển thị tab quản trị
    isAdminTabOpen = !isAdminTabOpen;
    if (isAdminTabOpen) {
        // Kích hoạt tab quản trị
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        adminTabBtn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        adminTab.style.display = 'block';
    } else {
        // Ẩn tab quản trị và hiển thị tab chat
        adminTabBtn.classList.remove('active');
        adminTab.style.display = 'none';
        document.querySelector('[data-tab="chat"]').classList.add('active');
        document.getElementById('chat-tab').style.display = 'block';
    }
});

// Hàm xử lý các chức năng quản trị
async function listUsers() {
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        let userList = 'Danh sách người dùng:\n';
        for (const uid in users) {
            userList += `- ${users[uid].displayName} (${users[uid].email})\n`;
        }
        alert(userList);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        alert('Có lỗi xảy ra khi lấy danh sách người dùng');
    }
}

async function blockUser() {
    const email = prompt('Nhập email của người dùng cần khóa:');
    if (email) {
        try {
            const usersSnapshot = await database.ref('users').orderByChild('email').equalTo(email).once('value');
            const users = usersSnapshot.val();
            if (users) {
                const uid = Object.keys(users)[0];
                await database.ref(`users/${uid}/blocked`).set(true);
                alert('Đã khóa người dùng thành công');
            } else {
                alert('Không tìm thấy người dùng với email này');
            }
        } catch (error) {
            console.error('Lỗi khi khóa người dùng:', error);
            alert('Có lỗi xảy ra khi khóa người dùng');
        }
    }
}

async function listGroups() {
    try {
        const groupsSnapshot = await database.ref('groups').once('value');
        const groups = groupsSnapshot.val();
        let groupList = 'Danh sách nhóm:\n';
        for (const groupId in groups) {
            groupList += `- ${groups[groupId].name}\n`;
        }
        alert(groupList);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhóm:', error);
        alert('Có lỗi xảy ra khi lấy danh sách nhóm');
    }
}

async function deleteGroup() {
    const groupName = prompt('Nhập tên nhóm cần xóa:');
    if (groupName) {
        try {
            const groupsSnapshot = await database.ref('groups').orderByChild('name').equalTo(groupName).once('value');
            const groups = groupsSnapshot.val();
            if (groups) {
                const groupId = Object.keys(groups)[0];
                await database.ref(`groups/${groupId}`).remove();
                alert('Đã xóa nhóm thành công');
            } else {
                alert('Không tìm thấy nhóm với tên này');
            }
        } catch (error) {
            console.error('Lỗi khi xóa nhóm:', error);
            alert('Có lỗi xảy ra khi xóa nhóm');
        }
    }
}

function generalSettings() {
    alert('Tính năng đang được phát triển');
}

function backupData() {
    alert('Tính năng đang được phát triển');
}

// Tải danh sách người dùng có thể mời
async function loadAvailableUsers() {
    const usersList = document.getElementById('available-users-list');
    usersList.innerHTML = '';
    
    try {
        // Lấy danh sách tất cả người dùng
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        
        // Lấy danh sách thành viên hiện tại của nhóm
        const groupSnapshot = await database.ref(`groups/${currentGroupId}`).once('value');
        const groupData = groupSnapshot.val();
        const currentMembers = groupData.members || {};
        
        // Hiển thị người dùng chưa tham gia nhóm
        for (const [userId, userData] of Object.entries(users)) {
            if (!currentMembers[userId]) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.innerHTML = `
                    <div class="user-info">
                        <img src="${userData.avatarUrl || 'https://via.placeholder.com/40'}" alt="${userData.displayName}" class="user-avatar">
                        <span>${userData.displayName}</span>
                    </div>
                    <button class="invite-btn" data-user-id="${userId}">Mời</button>
                `;
                usersList.appendChild(userDiv);
            }
        }
        
        // Xử lý sự kiện mời người dùng
        usersList.querySelectorAll('.invite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userId;
                try {
                    // Thêm người dùng vào nhóm
                    await database.ref(`groups/${currentGroupId}/members/${userId}`).set(true);
                    // Cập nhật giao diện
                    e.target.textContent = 'Đã mời';
                    e.target.classList.add('invited');
                    e.target.disabled = true;
                    // Cập nhật danh sách thành viên
                    showGroupInfo(currentGroupId);
                } catch (error) {
                    console.error('Lỗi khi mời thành viên:', error);
                    alert('Có lỗi xảy ra khi mời thành viên');
                }
            });
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách người dùng:', error);
        usersList.innerHTML = '<p>Có lỗi xảy ra khi tải danh sách người dùng</p>';
    }
}

closeGroupInfoBtn.addEventListener('click', () => {
    groupInfoModal.style.display = 'none';
});

// Thêm thành viên vào nhóm
addMemberBtn.addEventListener('click', async () => {
    const memberEmail = addMemberInput.value.trim();
    if (memberEmail && currentGroupId !== 'public') {
        try {
            const userSnapshot = await database.ref('users').orderByChild('email').equalTo(memberEmail).once('value');
            const userData = userSnapshot.val();
            if (userData) {
                const userId = Object.keys(userData)[0];
                await database.ref(`groups/${currentGroupId}/members/${userId}`).set(true);
                addMemberInput.value = '';
                showGroupInfo(currentGroupId);
            } else {
                alert('Không tìm thấy người dùng với email này');
            }
        } catch (error) {
            console.error('Lỗi khi thêm thành viên:', error);
            alert('Có lỗi xảy ra khi thêm thành viên');
        }
    }
});

// Hiển thị thông tin nhóm
async function showGroupInfo(groupId) {
    const groupSnapshot = await database.ref(`groups/${groupId}`).once('value');
    const groupData = groupSnapshot.val();
    if (groupData && groupData.members) {
        groupMembersList.innerHTML = '';
        for (const memberId in groupData.members) {
            const memberSnapshot = await database.ref(`users/${memberId}`).once('value');
            const memberData = memberSnapshot.val();
            if (memberData) {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'member-item';
                memberDiv.innerHTML = `
                    <span>${memberData.email}</span>
                    ${memberId !== groupData.createdBy ? `
                        <button class="remove-member-btn" data-member-id="${memberId}">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                `;
                groupMembersList.appendChild(memberDiv);
            }
        }
    }
}

// Xử lý xóa thành viên
groupMembersList.addEventListener('click', async (e) => {
    if (e.target.closest('.remove-member-btn')) {
        const memberId = e.target.closest('.remove-member-btn').dataset.memberId;
        try {
            await database.ref(`groups/${currentGroupId}/members/${memberId}`).remove();
            showGroupInfo(currentGroupId);
        } catch (error) {
            console.error('Lỗi khi xóa thành viên:', error);
            alert('Có lỗi xảy ra khi xóa thành viên');
        }
    }
});

// Hiển thị danh sách nhóm
database.ref('groups').on('value', (snapshot) => {
    const groups = snapshot.val();
    groupsList.innerHTML = `
        <div class="group-item ${currentGroupId === 'public' ? 'active' : ''}" data-group-id="public">
            Chat Chung
        </div>
    `;
    
    if (groups) {
        Object.entries(groups).forEach(([groupId, groupData]) => {
            if (groupData.members && groupData.members[auth.currentUser.uid]) {
                const groupDiv = document.createElement('div');
                groupDiv.className = `group-item ${currentGroupId === groupId ? 'active' : ''}`;
                groupDiv.dataset.groupId = groupId;
                groupDiv.textContent = groupData.name;
                groupsList.appendChild(groupDiv);
            }
        });
    }
});

// Chuyển đổi giữa các nhóm chat
groupsList.addEventListener('click', async (e) => {
    const groupItem = e.target.closest('.group-item');
    if (groupItem) {
        const groupId = groupItem.dataset.groupId;
        currentGroupId = groupId;
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.toggle('active', item.dataset.groupId === groupId);
        });

        // Cập nhật tiêu đề chat dựa trên loại chat
        const chatHeader = document.getElementById('chat-header');
        if (groupId === 'public') {
            chatHeader.innerHTML = `
                <div class="chat-header">
                    <h3>Chat Chung</h3>
                </div>
            `;
        } else if (!groupId.startsWith('private_')) {
            // Lấy thông tin nhóm từ database
            const groupSnapshot = await database.ref(`groups/${groupId}`).once('value');
            const groupData = groupSnapshot.val();
            if (groupData) {
                chatHeader.innerHTML = `
                    <div class="chat-header">
                        <div class="group-info">
                            <h3 class="group-name">${groupData.name}</h3>
                            <span class="group-members-count">Nhóm chat</span>
                        </div>
                        <button class="group-info-btn" id="group-info-btn">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                `;
            }
        }

        messagesDiv.innerHTML = '';
        loadMessages(groupId);
    }
});

// Gửi tin nhắn
function sendMessage() {
    const message = messageInput.value.trim();

    if (message) {
        const username = usernameInput.value || 'Ẩn danh';

        // Lấy avatarUrl từ currentUserProfile
        const avatarUrl = currentUserProfile?.avatarUrl || 'https://via.placeholder.com/40';

        // Xác định đường dẫn tin nhắn dựa vào loại chat
        let messageRef;
        if (currentGroupId === 'public') {
            messageRef = 'public_messages';
        } else if (currentGroupId.startsWith('private_')) {
            messageRef = `private_messages/${currentGroupId}`;
        } else {
            messageRef = `group_messages/${currentGroupId}`;
        }

        // Thêm tin nhắn vào database Firebase
        database.ref(messageRef).push({
            username: username,
            text: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userId: auth.currentUser.uid,
            avatarUrl: avatarUrl
        });

        // Xóa nội dung tin nhắn trong input
        messageInput.value = '';
    }
}

// Tải và hiển thị tin nhắn
function loadMessages(groupId) {
    let messageRef;
    if (groupId === 'public') {
        messageRef = 'public_messages';
    } else if (groupId.startsWith('private_')) {
        messageRef = `private_messages/${groupId}`;
    } else {
        messageRef = `group_messages/${groupId}`;
    }
    
    database.ref(messageRef).off();
    database.ref(messageRef).orderByChild('timestamp').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// Biến lưu tin nhắn trước đó
let lastMessage = null;

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(message.userId === auth.currentUser?.uid ? 'sent' : 'received');

    // Kiểm tra xem tin nhắn có phải từ cùng một người dùng không
    const isSameUser = lastMessage && lastMessage.username === message.username;
    
    // Nếu là tin nhắn từ cùng người dùng, thêm vào message-group
    if (isSameUser) {
        const lastMessageDiv = messagesDiv.lastElementChild;
        if (!lastMessageDiv.classList.contains('message-group')) {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('message-group');
            lastMessageDiv.parentNode.insertBefore(groupDiv, lastMessageDiv);
            groupDiv.appendChild(lastMessageDiv);
            groupDiv.appendChild(messageDiv);
        } else {
            lastMessageDiv.appendChild(messageDiv);
        }
    }

    const header = document.createElement('div');
    header.classList.add('message-header');

    const statusIndicator = document.createElement('span');
    statusIndicator.classList.add('online-status');
    userStatusRef.child(message.username).once('value', (snap) => {
        statusIndicator.classList.add(snap.val() ? 'online' : 'offline');
    });

    // Thêm avatar hoặc tạo avatar mặc định
    let avatarElement;
    if (message.avatarUrl && message.avatarUrl !== 'https://via.placeholder.com/40') {
        const avatarImg = document.createElement('img');
        avatarImg.src = message.avatarUrl;
        avatarImg.classList.add('message-avatar');
        if (isSameUser) avatarImg.classList.add('message-avatar-hidden');
        avatarImg.alt = message.username;
        avatarElement = avatarImg.outerHTML;
    } else {
        avatarElement = createDefaultAvatar(message.username);
        if (isSameUser) {
            avatarElement = avatarElement.replace('class="message-avatar"', 'class="message-avatar message-avatar-hidden"');
        }
    }

    const time = new Date(message.timestamp).toLocaleTimeString();
    header.innerHTML = `
        ${statusIndicator.outerHTML}
        ${avatarElement}
        <strong>${message.username}</strong>
        <span class="message-time">${time}</span>
    `;

    messageDiv.appendChild(header);

    if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.url;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        messageDiv.appendChild(img);
    } else {
        const textDiv = document.createElement('div');
        textDiv.textContent = message.text;
        messageDiv.appendChild(textDiv);
    }

    // Nếu không phải tin nhắn từ cùng người dùng, thêm trực tiếp vào messagesDiv
    if (!isSameUser) {
        messagesDiv.appendChild(messageDiv);
    }

    // Cập nhật tin nhắn trước đó
    lastMessage = message;

    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Cuộn xuống dòng cuối của khung chat
function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Gọi scrollToBottom() khi trang tải xong để cuộn xuống tin nhắn cuối cùng
window.onload = scrollToBottom;

// Xử lý đăng xuất (tùy chọn)
// Xử lý tải và hiển thị thông tin hồ sơ người dùng
function loadUserProfile(userId) {
    // Kiểm tra xem có avatar URL trong localStorage không
    const storedAvatarUrl = localStorage.getItem(`avatarUrl_${userId}`);
    if (storedAvatarUrl) {
        updateProfileUI({ ...currentUserProfile, avatarUrl: storedAvatarUrl });
    }

    database.ref(`users/${userId}`).once('value')
        .then((snapshot) => {
            const profile = snapshot.val();
            if (profile) {
                currentUserProfile = profile;
                // Lưu avatar URL vào localStorage
                if (profile.avatarUrl) {
                    localStorage.setItem(`avatarUrl_${userId}`, profile.avatarUrl);
                }
                updateProfileUI(profile);
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải hồ sơ:', error);
        });
}

// Cập nhật giao diện hồ sơ người dùng
function updateProfileUI(profile) {
    document.getElementById('user-avatar').src = profile.avatarUrl;
    document.getElementById('profile-username').textContent = profile.displayName;
    document.getElementById('edit-display-name').value = profile.displayName;
    document.getElementById('edit-bio').value = profile.bio || '';
    document.getElementById('edit-location').value = profile.location || '';
}

// Xử lý thay đổi ảnh đại diện
document.getElementById('change-avatar-btn').addEventListener('click', () => {
    document.getElementById('avatar-upload').click();
});

document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Kiểm tra định dạng file
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
            return;
        }

        // Xem trước ảnh
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('user-avatar').src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Hiển thị loading
        loadingIndicator.style.display = 'block';

        // Tạo tên file ngẫu nhiên để tránh trùng lặp
        const fileExtension = file.name.split('.').pop();
        const randomFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const storageRef = storage.ref(`avatars/${auth.currentUser.uid}/${randomFileName}`);
        
        // Nén ảnh trước khi tải lên
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tính toán kích thước mới để giữ tỷ lệ khung hình
            let width = img.width;
            let height = img.height;
            const maxSize = 800; // Kích thước tối đa
            
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Chuyển canvas thành blob
            canvas.toBlob((blob) => {
                storageRef.put(blob).then(() => {
                    return storageRef.getDownloadURL();
                }).then((url) => {
                    return database.ref(`users/${auth.currentUser.uid}`).update({
                        avatarUrl: url
                    });
                }).then(() => {
                    currentUserProfile.avatarUrl = document.getElementById('user-avatar').src;
                }).catch((error) => {
                    console.error('Lỗi khi tải lên ảnh đại diện:', error);
                    alert('Lỗi khi tải lên ảnh đại diện: ' + error.message);
                    // Khôi phục ảnh đại diện cũ nếu có lỗi
                    document.getElementById('user-avatar').src = currentUserProfile.avatarUrl;
                }).finally(() => {
                    loadingIndicator.style.display = 'none';
                    URL.revokeObjectURL(img.src);
                });
            }, 'image/jpeg', 0.8);
        };

    }
});

// Xử lý hiển thị modal chỉnh sửa hồ sơ
document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'flex';
});

document.getElementById('close-profile-modal').addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'none';
});

// Xử lý lưu thông tin hồ sơ
document.getElementById('save-profile-btn').addEventListener('click', () => {
    const updatedProfile = {
        displayName: document.getElementById('edit-display-name').value,
        bio: document.getElementById('edit-bio').value,
        location: document.getElementById('edit-location').value,
        email: currentUserProfile.email,
        avatarUrl: currentUserProfile.avatarUrl
    };

    database.ref(`users/${auth.currentUser.uid}`).update(updatedProfile)
        .then(() => {
            currentUserProfile = updatedProfile;
            updateProfileUI(updatedProfile);
            document.getElementById('edit-profile-modal').style.display = 'none';
            alert('Hồ sơ đã được cập nhật thành công!');
        })
        .catch(error => {
            console.error('Lỗi khi cập nhật hồ sơ:', error);
            alert('Có lỗi xảy ra khi cập nhật hồ sơ');
        });
});

function logout() {
    auth.signOut().then(() => {
        // Đăng xuất thành công
        console.log('Đăng xuất thành công');
        // Xóa tên hiển thị khỏi localStorage và currentUserProfile
        localStorage.removeItem('username');
        currentUserProfile = null;
        // Hiển thị lại khung đăng nhập/đăng ký
        authContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    }).catch((error) => {
        // Xử lý lỗi đăng xuất
        console.error('Lỗi đăng xuất:', error);
    });
}


// Hàm lắng nghe thay đổi trạng thái kết bạn
function listenToFriendshipChanges() {
  if (!auth.currentUser) return;

  // Lắng nghe thay đổi trong danh sách bạn bè
  database.ref(`friends/${auth.currentUser.uid}`).on('value', (snapshot) => {
    loadFriendsList();
  });

  // Lắng nghe thay đổi trong lời mời kết bạn
  database.ref(`friendRequests/${auth.currentUser.uid}`).on('value', (snapshot) => {
    loadUsersList();
  });
}

// Thêm gọi hàm lắng nghe khi người dùng đăng nhập thành công
auth.onAuthStateChanged((user) => {
  if (user) {
    listenToFriendshipChanges();
  } else {
    // Hủy đăng ký lắng nghe khi đăng xuất
    if (auth.currentUser) {
      database.ref(`friends/${auth.currentUser.uid}`).off();
      database.ref(`friendRequests/${auth.currentUser.uid}`).off();
    }
  }
});
