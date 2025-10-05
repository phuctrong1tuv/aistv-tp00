// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [
  {
    role: "assistant",
    content:
      "Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?",
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

// Click send
sendButton.addEventListener("click", sendMessage);

/**
 * Sends a message to the chat API and processes the response
 */
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
    // Create assistant message
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


/**
 * Format message: detect code, links, and add copy button
 */
function formatMessage(text) {
  // Code block regex: ```lang\ncode```
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let html = text.replace(codeRegex, (match, lang, code) => {
    lang = lang || "plaintext";
    const escaped = code.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    return `
      <div class="code-block">
        <div class="code-header">
          <span>${lang}</span>
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
        </div>
        <pre><code class="language-${lang}">${escaped}</code></pre>
      </div>
    `;
  });

  // Convert URLs to links
  html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

  return html;
}

/**
 * Add message to chat
 */
function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;
  messageEl.innerHTML = `<p>${formatMessage(content)}</p>`;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (window.Prism) Prism.highlightAll();
}


/**
 * Copy code button
 */
function copyCode(btn) {
  const code = btn.closest(".code-block").querySelector("code").innerText;
  navigator.clipboard.writeText(code);
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = "Copy"), 2000);
}
<script>
      function formatMessage(text) {
        // link -> clickable
        text = text.replace(
          /(https?:\/\/[^\s]+)/g,
          '<a href="$1" target="_blank">$1</a>'
        );

        // code block ```
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        text = text.replace(codeRegex, (match, lang, code) => {
          const detectedLang = lang || detectLanguage(code);
          const safeCode = code.replace(/[<>&]/g, (c) =>
            ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])
          );
          // Correct structure: button and label inside <pre>
          return `
            <pre>
              <span class="lang-label">${detectedLang}</span>
              <button class="copy-btn" onclick="copyCode(this)">Sao chép</button>
              <code class="${detectedLang}">${safeCode}</code>
            </pre>`;
        });

        return text;
      }

      function detectLanguage(code) {
        if (code.includes("<?php")) return "php";
        if (code.includes("function") || code.includes("const") || code.includes("let"))
          return "javascript";
        if (code.includes("def ") || code.includes("import ")) return "python";
        if (code.includes("<html")) return "html";
        return "plaintext";
      }

      function copyCode(btn) {
        // Get the inner text of the <code> element within the same <pre>
        const code = btn.parentElement.querySelector("code").innerText;
        navigator.clipboard.writeText(code);
        
        // Feedback in Vietnamese
        btn.innerText = "Đã sao chép!";
        
        setTimeout(() => (btn.innerText = "Sao chép"), 1500);
      }

      function highlightCodeBlocks() {
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightElement(block);
        });
      }
      
        const contentContainer = document.getElementById('content-container');
        const menuItems = document.querySelectorAll('.menu-item');
        const pageTitle = document.getElementById('current-page-title');

        /**
         * Tải nội dung HTML từ một URL (file) vào khu vực chính.
         * @param {string} url - Đường dẫn tới file HTML.
         * @param {string} title - Tiêu đề của trang.
         */
        async function loadContent(url, title) {
            try {
                // Đặt trạng thái tải
                contentContainer.innerHTML = `<p style="text-align: center; padding: 50px;">Đang tải nội dung ${title}...</p>`;
                pageTitle.textContent = title;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Không thể tải file: ${response.statusText}`);
                }
                const htmlContent = await response.text();
                
                // Chèn nội dung vào container
                contentContainer.innerHTML = htmlContent;
                
                // Nếu file tải là taoanh.html, cần chạy lại script của nó
                if (url === 'taoanh.html') {
                    executeScripts(contentContainer);
                }

            } catch (error) {
                console.error("Lỗi khi tải nội dung:", error);
                contentContainer.innerHTML = `<h2 style="color: red; text-align: center; padding: 50px;">LỖI: Không thể tải trang. (${error.message})</h2>`;
            }
        }
        
        // Hàm để chạy lại các thẻ <script> sau khi tải nội dung mới
        function executeScripts(targetElement) {
            const scripts = targetElement.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                // Sao chép thuộc tính
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                
                // Thay thế script cũ bằng script mới để trình duyệt thực thi lại
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }

        // ----------------------------------------------------------------------
        // Xử lý sự kiện click trên Menu
        // ----------------------------------------------------------------------
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.id;
                
                // Xóa lớp 'active' khỏi tất cả
                menuItems.forEach(i => i.classList.remove('active'));
                // Thêm lớp 'active' cho mục được chọn
                item.classList.add('active');

                // Xử lý logic tải trang dựa trên ID
                if (id === 'menu-taoanh') {
                    loadContent('Taoanh.html', 'Tạo Ảnh AI');
                } else if (id === 'menu-trangchu') {
                    loadContent('trangchu.html', 'Trang Chủ');
                }
                // Các mục khác có thể được xử lý tương tự
            });
        });

        // Tải trang mặc định khi khởi động (Tạo Ảnh AI)
        document.addEventListener('DOMContentLoaded', () => {
            loadContent('Taoanh.html', 'Tạo Ảnh AI');
        });
}


    
    
