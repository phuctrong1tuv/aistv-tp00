// Tabs logic
const chatTab = document.getElementById("chat-tab");
const imageTab = document.getElementById("image-tab");
const chatPanel = document.getElementById("chat-panel");
const imagePanel = document.getElementById("image-panel");

chatTab.addEventListener("click", () => {
  chatTab.classList.add("active");
  imageTab.classList.remove("active");
  chatPanel.style.display = "";
  imagePanel.style.display = "none";
});
imageTab.addEventListener("click", () => {
  imageTab.classList.add("active");
  chatTab.classList.remove("active");
  imagePanel.style.display = "";
  chatPanel.style.display = "none";
});

// --- Chat logic (giống như bạn gửi) ---
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

let chatHistory = [
  {
    role: "assistant",
    content:
      "Xin chào! Tôi là ứng dụng ChatGPT mini tích hợp AI. Bạn cần giúp gì hôm nay?",
  },
];
let isProcessing = false;

// Auto-resize textarea
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Enter to send
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
sendButton.addEventListener("click", sendMessage);

function addMessageToChat(role, content) {
  const msgEl = document.createElement("div");
  msgEl.className = "message " + (role === "user" ? "user-message" : "assistant-message");
  msgEl.innerHTML = formatMessage(content);
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (window.Prism) Prism.highlightAll();
}
function formatMessage(text) {
  // Đơn giản: hỗ trợ code block ```lang ... ```
  return text.replace(/```([a-z]*)\n([\s\S]*?)```/g, function(match, lang, code) {
    const l = lang || "";
    return `<pre><code class="language-${l}">${escapeHtml(code)}</code></pre>`;
  });
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m];
  });
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "" || isProcessing) return;

  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  addMessageToChat("user", message);
  userInput.value = "";
  userInput.style.height = "auto";
  typingIndicator.classList.add("visible");
  chatHistory.push({ role: "user", content: message });

  try {
    // Create assistant message element (for streaming)
    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    const p = document.createElement("p");
    assistantMessageEl.appendChild(p);
    chatMessages.appendChild(assistantMessageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });

    if (!response.ok) throw new Error("Failed to get response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.response) {
            responseText += jsonData.response;
            p.innerHTML = formatMessage(responseText);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            if (window.Prism) Prism.highlightAll();
          }
        } catch {}
      }
    }

    chatHistory.push({ role: "assistant", content: responseText });
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat(
      "assistant",
      "❌ Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn."
    );
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// --- Tạo ảnh từ text-to-image ---
const imageInput = document.getElementById("image-input");
const imageSendButton = document.getElementById("image-send-button");
const imageResult = document.getElementById("image-result");

imageSendButton.addEventListener("click", createImage);
imageInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    createImage();
  }
});

async function createImage() {
  const prompt = imageInput.value.trim();
  if (!prompt) return;
  imageSendButton.disabled = true;
  imageResult.innerHTML = "<span>Đang tạo ảnh...</span>";

  try {
    const url = `https://text-to-image-template.trongphucpython.workers.dev/?prompt=${encodeURIComponent(prompt)}`;
    // Có thể server trả về trực tiếp ảnh hoặc json có url, ở đây giả sử trả về ảnh
    imageResult.innerHTML = `<img src="${url}" alt="Ảnh AI tạo từ mô tả">`;
  } catch (err) {
    imageResult.innerHTML = "<span>❌ Không tạo được ảnh.</span>";
  } finally {
    imageSendButton.disabled = false;
  }
}
