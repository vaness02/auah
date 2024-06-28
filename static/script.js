document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('chat-form');
    const chatbox = document.getElementById('chatbox');
    const historyContent = document.getElementById('history-content');
    const newSessionButton = document.getElementById('new-session');
    const saveSessionButton = document.getElementById('save-session');
    const deleteSessionButton = document.getElementById('delete-session');
    let currentChat = [];
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let chatNames = JSON.parse(localStorage.getItem('chatNames')) || {};
    let currentIndex = chatHistory.length;

    function renderChatHistory() {
        historyContent.innerHTML = '';
        chatHistory.forEach((historyItem, index) => {
            const chatId = `chat_${index}`;
            const chatName = chatNames[chatId] || `Chat ${index + 1}`;
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="chat-name">${chatName}</span>
                <input type="text" class="rename-input" value="${chatName}">
                <button class="rename-button"><i class="fas fa-edit"></i></button>
            `;
            item.querySelector('.rename-button').addEventListener('click', (e) => {
                e.stopPropagation();
                const input = item.querySelector('.rename-input');
                const span = item.querySelector('.chat-name');
                if (input.style.display === 'none' || input.style.display === '') {
                    input.style.display = 'inline-block';
                    span.style.display = 'none';
                    input.focus();
                } else {
                    const newName = input.value.trim();
                    if (newName) {
                        chatNames[chatId] = newName;
                        localStorage.setItem('chatNames', JSON.stringify(chatNames));
                        span.textContent = newName;
                    }
                    input.style.display = 'none';
                    span.style.display = 'inline-block';
                }
            });
            item.addEventListener('click', () => loadChatHistory(index));
            historyContent.appendChild(item);
        });
    }

    function loadChatHistory(index) {
        const historyItem = chatHistory[index];
        chatbox.innerHTML = '';
        historyItem.forEach(message => {
            chatbox.innerHTML += `
                <div class="${message.sender.toLowerCase()}-message">
                    <div class="avatar-name">
                        <img src="/static/img/${message.sender.toLowerCase()}.png" alt="${message.sender} Image" class="avatar">
                        <span>${message.sender}</span>
                    </div>
                    <div class="message-text">${message.text}</div>
                </div>
            `;
        });
        chatbox.scrollTop = chatbox.scrollHeight;
        currentIndex = index;
        currentChat = JSON.parse(JSON.stringify(historyItem)); // Buat salinan mendalam
    }

    function showWelcomeMessage() {
        if (currentChat.length === 0) {
            const welcomeMessage = { sender: 'CoffeeBot', text: 'Hi. Selamat datang di chatbot kopi! Bagaimana saya bisa membantu Anda hari ini?' };
            currentChat.push(welcomeMessage);
            chatbox.innerHTML += `
                <div class="coffeebot-message">
                    <div class="avatar-name">
                        <img src="/static/img/coffeebot.png" alt="CoffeeBot Image" class="avatar">
                        <span>CoffeeBot</span>
                    </div>
                    <div class="message-text">${welcomeMessage.text}</div>
                </div>
            `;
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    }

    if (chatHistory.length === 0) {
        showWelcomeMessage();
    } else {
        loadChatHistory(currentIndex - 1); // Load sesi chat terakhir jika ada
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const question = formData.get('question');

        chatbox.innerHTML += `
            <div class="anda-message">
                <div class="avatar-name">
                    <img src="/static/img/anda.png" alt="Anda Image" class="avatar">
                    <span>Anda</span>
                </div>
                <div class="message-text">${question}</div>
            </div>
        `;

        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'coffeebot-message';
        loadingMessage.innerHTML = `
            <div class="avatar-name">
                <img src="/static/img/coffeebot.png" alt="CoffeeBot Image" class="avatar">
                <span>CoffeeBot</span>
            </div>
            <div class="message-text typing">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        chatbox.appendChild(loadingMessage);

        chatbox.scrollTop = chatbox.scrollHeight;

        fetch('/ask', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            chatbox.removeChild(loadingMessage);
            chatbox.innerHTML += `
                <div class="coffeebot-message">
                    <div class="avatar-name">
                        <img src="/static/img/coffeebot.png" alt="CoffeeBot Image" class="avatar">
                        <span>CoffeeBot</span>
                    </div>
                    <div class="message-text">${data.text}</div>
                </div>
            `;

            chatbox.scrollTop = chatbox.scrollHeight;
            form.reset();

            currentChat.push({ sender: 'Anda', text: question });
            currentChat.push({ sender: 'CoffeeBot', text: data.text });
        })
        .catch(error => {
            chatbox.removeChild(loadingMessage);
            console.error('Error:', error);
        });
    });

    window.addEventListener('beforeunload', function() {
        if (currentChat.length > 0) {
            chatHistory[currentIndex] = JSON.parse(JSON.stringify(currentChat)); // Buat salinan mendalam
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('chatNames', JSON.stringify(chatNames));
        }
    });

    newSessionButton.addEventListener('click', function() {
        if (currentChat.length > 0) {
            chatHistory[currentIndex] = JSON.parse(JSON.stringify(currentChat)); // Simpan sesi saat ini sebelum membuat yang baru
        }
        currentChat = [];
        chatbox.innerHTML = '';
        showWelcomeMessage(); // Panggil fungsi untuk menampilkan pesan sambutan saat memulai sesi baru
        chatbox.scrollTop = chatbox.scrollHeight;
        currentIndex = chatHistory.length; // Pindahkan currentIndex ke akhir
    });

    saveSessionButton.addEventListener('click', function() {
        if (currentChat.length > 0) {
            chatHistory[currentIndex] = JSON.parse(JSON.stringify(currentChat)); // Update sesi saat ini dengan salinan mendalam
            const chatId = `chat_${currentIndex}`;
            if (!chatNames[chatId]) {
                chatNames[chatId] = `Chat ${currentIndex + 1}`;
            }
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('chatNames', JSON.stringify(chatNames));
            renderChatHistory();
        }
    });

    deleteSessionButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this chat session?')) {
            const chatId = `chat_${currentIndex}`;
            chatHistory.splice(currentIndex, 1);
            delete chatNames[chatId];
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('chatNames', JSON.stringify(chatNames));
            currentChat = [];
            chatbox.innerHTML = '';
            currentIndex = chatHistory.length;
            renderChatHistory();
        }
    });

    renderChatHistory();
});
