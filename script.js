// Cấu hình Firebase
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

            // Ẩn khung đăng nhập và hiển thị khung chat
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';

            // Cuộn xuống tin nhắn cuối cùng
            scrollToBottom();
        })
        .catch((error) => {
            // Xử lý lỗi đăng nhập
            console.error('Lỗi đăng nhập:', error);
            alert('Lỗi đăng nhập: ' + error.message); // Hiển thị thông báo lỗi cho người dùng
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

    // Hiển thị chỉ báo tải
    loadingIndicator.style.display = 'block';

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Đăng ký thành công
            const user = userCredential.user;
            console.log('Đăng ký thành công:', user);

            // Lưu tên hiển thị vào localStorage
            localStorage.setItem('username', usernameInput.value);

            // Ẩn khung đăng ký và hiển thị khung chat
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';

            // Cuộn xuống tin nhắn cuối cùng
            scrollToBottom();
        })
        .catch((error) => {
            // Xử lý lỗi đăng ký
            console.error('Lỗi đăng ký:', error);
            alert('Lỗi đăng ký: ' + error.message); // Hiển thị thông báo lỗi cho người dùng
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

function sendMessage() {
    const message = messageInput.value.trim(); // Loại bỏ khoảng trắng thừa

    if (message) {
        const username = usernameInput.value || 'Ẩn danh'; // Sử dụng 'Ẩn danh' nếu tên hiển thị trống

        // Thêm tin nhắn vào database Firebase
        database.ref('messages').push({
            username: username,
            text: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Xóa nội dung tin nhắn trong input
        messageInput.value = '';
    }
}

// Hiển thị tin nhắn
database.ref('messages').on('child_added', (snapshot) => {
    const message = snapshot.val();
    displayMessage(message);
});

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (message.username === usernameInput.value) {
        messageDiv.classList.add('sent');
    } else {
        messageDiv.classList.add('received');
    }

    messageDiv.innerHTML = `<strong>${message.username}:</strong> ${message.text}`;
    messagesDiv.appendChild(messageDiv);

    // Cuộn xuống cuối tin nhắn
    scrollToBottom();
}

// Cuộn xuống dòng cuối của khung chat
function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Gọi scrollToBottom() khi trang tải xong để cuộn xuống tin nhắn cuối cùng
window.onload = scrollToBottom;

// Xử lý đăng xuất (tùy chọn)
function logout() {
    auth.signOut().then(() => {
        // Đăng xuất thành công
        console.log('Đăng xuất thành công');
        // Xóa tên hiển thị khỏi localStorage
        localStorage.removeItem('username');
        // Hiển thị lại khung đăng nhập/đăng ký
        authContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    }).catch((error) => {
        // Xử lý lỗi đăng xuất
        console.error('Lỗi đăng xuất:', error);
    });
}