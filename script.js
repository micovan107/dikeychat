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

// Xử lý trạng thái online/offline
const userStatusRef = database.ref('status');
const connectedRef = database.ref('.info/connected');

connectedRef.on('value', (snap) => {
    if (snap.val() === true && auth.currentUser) {
        const statusRef = userStatusRef.child(auth.currentUser.uid);
        statusRef.set(true);
        statusRef.onDisconnect().remove();
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
groupsList.addEventListener('click', (e) => {
    const groupItem = e.target.closest('.group-item');
    if (groupItem) {
        const groupId = groupItem.dataset.groupId;
        currentGroupId = groupId;
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.toggle('active', item.dataset.groupId === groupId);
        });
        currentChatName.textContent = groupId === 'public' ? 'Chat Chung' : groupItem.textContent;
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

        // Thêm tin nhắn vào database Firebase
        const messageRef = currentGroupId === 'public' ? 'public_messages' : `group_messages/${currentGroupId}`;
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
    const messageRef = groupId === 'public' ? 'public_messages' : `group_messages/${groupId}`;
    database.ref(messageRef).off();
    database.ref(messageRef).orderByChild('timestamp').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(message.userId === auth.currentUser?.uid ? 'sent' : 'received');

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
        avatarImg.alt = message.username;
        avatarElement = avatarImg.outerHTML;
    } else {
        avatarElement = createDefaultAvatar(message.username);
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
