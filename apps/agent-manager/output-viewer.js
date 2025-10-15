// Output Viewer JavaScript
let currentContent = '';
let currentFilename = '';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Get filename from URL query parameter
    const params = new URLSearchParams(window.location.search);
    currentFilename = params.get('file');

    if (!currentFilename) {
        showError('No file specified');
        return;
    }

    await loadOutput(currentFilename);
});

// Load and display output
async function loadOutput(filename) {
    try {
        const response = await fetch(`/api/output/${filename}`);

        if (!response.ok) {
            throw new Error('Failed to load output');
        }

        currentContent = await response.text();
        displayOutput(currentContent, filename);
        updateFileInfo(filename, currentContent);
        generateTableOfContents();

    } catch (error) {
        console.error('Error loading output:', error);
        showError('Failed to load output file');
    }
}

// Display the output content
function displayOutput(content, filename) {
    const contentDiv = document.getElementById('output-content');
    const titleElement = document.getElementById('document-title');
    const filenameElement = document.getElementById('filename');

    // Update title and breadcrumb
    titleElement.textContent = formatTitle(filename);
    filenameElement.textContent = filename;

    // Format and display content based on file type
    if (filename.endsWith('.md')) {
        contentDiv.innerHTML = renderMarkdown(content);
    } else if (filename.endsWith('.json')) {
        try {
            const jsonObj = JSON.parse(content);
            contentDiv.innerHTML = `<pre class="json-viewer">${JSON.stringify(jsonObj, null, 2)}</pre>`;
        } catch (e) {
            contentDiv.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
        }
    } else {
        contentDiv.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    }

    // Add syntax highlighting if needed
    highlightCodeBlocks();
}

// Update file information in sidebar
function updateFileInfo(filename, content) {
    const fileInfoDiv = document.getElementById('file-info');
    const fileSize = new Blob([content]).size;
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(word => word.length > 0).length;

    fileInfoDiv.innerHTML = `
        <div class="file-info-item">
            <span class="file-info-label">Type</span>
            <span class="file-info-value">${getFileType(filename)}</span>
        </div>
        <div class="file-info-item">
            <span class="file-info-label">Size</span>
            <span class="file-info-value">${formatFileSize(fileSize)}</span>
        </div>
        <div class="file-info-item">
            <span class="file-info-label">Lines</span>
            <span class="file-info-value">${lines.toLocaleString()}</span>
        </div>
        <div class="file-info-item">
            <span class="file-info-label">Words</span>
            <span class="file-info-value">${words.toLocaleString()}</span>
        </div>
    `;
}

// Generate table of contents from headers
function generateTableOfContents() {
    const tocDiv = document.getElementById('toc');
    const headers = document.querySelectorAll('.output-content h1, .output-content h2, .output-content h3');

    if (headers.length === 0) {
        tocDiv.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No headers found</p>';
        return;
    }

    let tocHTML = '';
    headers.forEach((header, index) => {
        const level = header.tagName.toLowerCase();
        const text = header.textContent;
        const id = `heading-${index}`;
        header.id = id;

        tocHTML += `
            <div class="toc-item toc-${level}" onclick="scrollToElement('${id}')">
                ${text}
            </div>
        `;
    });

    tocDiv.innerHTML = tocHTML;
}

// Scroll to element
function scrollToElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update active state
        document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

// Copy content to clipboard
async function copyContent() {
    try {
        await navigator.clipboard.writeText(currentContent);
        showSuccess('Copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    }
}

// Download content
function downloadContent() {
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Download started!');
}

// Render markdown to HTML
function renderMarkdown(text) {
    // Escape HTML first
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold and Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        return `<pre class="language-${lang || 'plaintext'}"><code>${code}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Blockquotes
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p><hr><\/p>/g, '<hr>');

    return html;
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'md': 'Markdown',
        'json': 'JSON',
        'txt': 'Text',
        'log': 'Log',
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'html': 'HTML',
        'css': 'CSS'
    };
    return types[ext] || ext.toUpperCase();
}

function formatTitle(filename) {
    // Remove extension and format nicely
    let title = filename.replace(/\.[^/.]+$/, '');
    title = title.replace(/-/g, ' ');
    title = title.replace(/_/g, ' ');

    // Capitalize words
    return title.replace(/\b\w/g, char => char.toUpperCase());
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showError(message) {
    const contentDiv = document.getElementById('output-content');
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 60px; color: var(--error);">
            <h2>Error</h2>
            <p>${message}</p>
            <a href="/" style="margin-top: 20px; display: inline-block;">Back to Agents</a>
        </div>
    `;
}

function showSuccess(message) {
    // Create or get feedback element
    let feedback = document.querySelector('.success-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'success-feedback';
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.classList.add('show');

    setTimeout(() => {
        feedback.classList.remove('show');
    }, 3000);
}

// Add basic syntax highlighting for code blocks
function highlightCodeBlocks() {
    // This is a placeholder - you could integrate highlight.js or prism.js here
    // For now, just ensure code blocks look good
    document.querySelectorAll('pre code').forEach((block) => {
        // Basic formatting is handled by CSS
    });
}