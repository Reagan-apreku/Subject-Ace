// State Management
let state = {
    view: 'dashboard',
    guides: [],
    folders: [],
    currentFolderId: 'root', // 'root' or a folder uuid
    activeGuide: null,
    searchQuery: '',
    currentTab: 'chat',
    loading: false,
    user: null
};

// DOM Cache
const dom = {
    guidesGrid: document.getElementById('guides-grid'),
    listGrid: document.getElementById('list-grid'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewList: document.getElementById('view-list'),
    viewToolDetail: document.getElementById('view-tool-detail'),
    toolContentArea: document.getElementById('tool-content-area'),
    viewTitle: document.getElementById('view-title'),
    viewSubtitle: document.getElementById('view-subtitle'),
    viewTitleTools: document.getElementById('view-title-tools'),
    viewSubtitleTools: document.getElementById('view-subtitle-tools'),
    toolDocTitle: document.getElementById('tool-doc-title'),
    toolActiveName: document.getElementById('tool-active-name'),
    searchInput: document.getElementById('search-input'),
    fileInput: document.getElementById('file-input'),
    globalLoader: document.getElementById('global-loader'),
    statCount: document.getElementById('stat-count'),
    studyDrawer: document.getElementById('study-drawer'),
    docTitle: document.getElementById('active-doc-title'),
    panelContent: document.getElementById('panel-content'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('send-btn'),
    foldersList: document.getElementById('folders-list'),
    authPortal: document.getElementById('auth-portal'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    userDisplayName: document.getElementById('user-display-name'),
    userInitials: document.getElementById('user-initials'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserInitials: document.getElementById('header-user-initials')
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    setupListeners();
    
    // Check for local session
    const savedUser = localStorage.getItem('ace_user');
    
    // Theme Check
    if (localStorage.getItem('ace_theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    if (savedUser) {
        state.user = JSON.parse(savedUser);
        updateUserUI();
        dom.authPortal.classList.add('hidden');
        await Promise.all([fetchGuides(), fetchFolders()]);
        renderView();
    }
}

function updateUserUI() {
    if (!state.user) return;
    const initials = state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    // Sidebar
    dom.userDisplayName.textContent = state.user.name;
    dom.userInitials.textContent = initials;
    
    // Header
    if (dom.headerUserName) dom.headerUserName.textContent = state.user.name;
    if (dom.headerUserInitials) dom.headerUserInitials.textContent = initials;
}

function setupListeners() {
    dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderView();
    });

    dom.fileInput.addEventListener('change', handleUpload);

    dom.sendBtn.addEventListener('click', askAi);
    dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') askAi();
    });
}

// Navigation
function setView(viewName) {
    state.view = viewName;
    state.activeGuide = null; // Clear active guide when switching top views
    
    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600');
        btn.classList.add('text-gray-400', 'hover:text-gray-600', 'hover:bg-gray-50');
    });
    
    const activeBtn = document.getElementById(`nav-${viewName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'hover:text-gray-600', 'hover:bg-gray-50');
        activeBtn.classList.add('bg-blue-50', 'text-blue-600');
    }

    updateViewTitles();
    renderView();
}

function setFolder(folderId) {
    state.currentFolderId = folderId;
    state.activeGuide = null;
    
    // Only go back to dashboard if we weren't in a tool view
    if (!['summary', 'quiz', 'flashcards'].includes(state.view)) {
        state.view = 'dashboard';
    }
    
    // Update nav highlights
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'hover:bg-gray-50');
    });
    
    if (state.view === 'dashboard' && folderId === 'root') {
        document.getElementById('nav-dashboard').classList.add('bg-blue-50', 'text-blue-600');
    } else if (state.view !== 'dashboard') {
        const toolBtn = document.getElementById(`nav-${state.view}`);
        if (toolBtn) toolBtn.classList.add('bg-blue-50', 'text-blue-600');
    }

    updateViewTitles();
    renderView();
}

function updateViewTitles() {
    if (state.view !== 'dashboard') {
        const titles = {
            summary: { t: 'AI Summaries', s: 'Quick, high-level overviews of your materials.' },
            quiz: { t: 'Quiz Generator', s: 'Test your knowledge with AI-powered questions.' },
            flashcards: { t: 'Flashcards', s: 'Active recall for better retention.' }
        };
        dom.viewTitleTools.textContent = titles[state.view].t;
        dom.viewSubtitleTools.textContent = titles[state.view].s;
    } else {
        // Dashboard / Folder Titles
        if (state.currentFolderId === 'root') {
            dom.viewTitle.textContent = 'Recent Materials';
            dom.viewSubtitle.textContent = 'Your five most recent study sessions.';
        } else {
            const folder = state.folders.find(f => f._id === state.currentFolderId);
            dom.viewTitle.textContent = folder ? folder.name : 'Folder View';
            dom.viewSubtitle.textContent = 'All documents in this collection.';
        }
    }
}

// Data Fetching
async function fetchGuides() {
    try {
        const res = await fetch('/api/guides');
        state.guides = await res.json();
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

async function fetchFolders() {
    try {
        const res = await fetch('/api/folders');
        state.folders = await res.json();
    } catch (e) {
        console.error('Folder fetch error:', e);
    }
}

async function promptCreateFolder() {
    const name = prompt("Enter folder name:");
    if (!name) return;

    try {
        const res = await fetch('/api/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId: state.currentFolderId }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            await fetchFolders();
            renderView();
        }
    } catch (e) {
        alert("Failed to create folder.");
    }
}

async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    state.loading = true;
    updateLoader();

    const formData = new FormData();
    formData.append('file', file);
    
    // Use the folder selected in the upload bar dropdown
    const targetFolderId = document.getElementById('upload-folder-select')?.value || 'root';
    formData.append('folderId', targetFolderId);

    try {
        const res = await fetch('/api/generate', { method: 'POST', body: formData });
        if (res.ok) {
            await fetchGuides();
            const newGuide = state.guides[0]; // Assuming newest is first
            
            // Auto-navigate to the folder where the file was uploaded
            state.view = 'dashboard';
            state.currentFolderId = targetFolderId;
            
            renderView();
            openDetail(newGuide._id);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    } catch (e) {
        alert('Upload failed. Check your connection.');
    } finally {
        state.loading = false;
        updateLoader();
    }
}

async function askAi() {
    const question = dom.chatInput.value.trim();
    if (!question || !state.activeGuide) return;

    const botMsgId = appendChat('bot', 'Computing answer...');
    dom.chatInput.value = '';

    try {
        const res = await fetch('/api/ask', {
            method: 'POST',
            body: JSON.stringify({ guideId: state.activeGuide._id, question }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        updateChat(botMsgId, data.answer);
    } catch (e) {
        updateChat(botMsgId, "Sorry, I couldn't process that question.");
    }
}

// Rendering Logic
function renderView() {
    // Sync the upload folder selector
    const uploadSelect = document.getElementById('upload-folder-select');
    if (uploadSelect) {
        uploadSelect.innerHTML = `<option value="root">Library Root</option>`;
        state.folders.forEach(f => {
            uploadSelect.innerHTML += `<option value="${f._id}" ${state.currentFolderId === f._id ? 'selected' : ''}>${f.name}</option>`;
        });
    }

    // Filter folders for the sidebar
    renderFolders();

    // Prepare content for the grid
    let gridItems = [];

    if (state.view === 'dashboard' && state.currentFolderId === 'root' && state.searchQuery === '') {
        // Dashboard "Recent" mode
        gridItems = state.guides.slice(0, 5);
    } else {
        // Hierarchical or Global Search mode
        const isSearching = state.searchQuery.length > 0;

        const subFolders = state.folders.filter(f => {
            const matchesSearch = f.name.toLowerCase().includes(state.searchQuery.toLowerCase());
            // If searching, show all matches. If not, only show children of current folder.
            const matchesParent = isSearching ? true : (f.parentId === state.currentFolderId);
            return matchesSearch && matchesParent;
        });

        const subGuides = state.guides.filter(g => {
            const matchesSearch = g.filename.toLowerCase().includes(state.searchQuery.toLowerCase());
            // If searching, show all matches. If not, only show files in current folder.
            const matchesFolder = isSearching ? true : (g.folderId === state.currentFolderId);
            return matchesSearch && matchesFolder;
        });
        
        // Mark items for renderGrid
        gridItems = [
            ...subFolders.map(f => ({ ...f, type: 'folder' })),
            ...subGuides.map(g => ({ ...g, type: 'guide' }))
        ];
    }

    dom.statCount.textContent = gridItems.filter(i => i.type !== 'folder').length;
    renderBreadcrumbs();

    if (state.view === 'dashboard' && state.currentFolderId === 'root') {
        dom.viewDashboard.classList.remove('hidden');
        dom.viewList.classList.add('hidden');
        dom.viewToolDetail.classList.add('hidden');
        renderGrid(dom.guidesGrid, gridItems);
    } else if (state.activeGuide) {
        dom.viewDashboard.classList.add('hidden');
        dom.viewList.classList.add('hidden');
        dom.viewToolDetail.classList.remove('hidden');
        renderActiveTool();
    } else {
        dom.viewDashboard.classList.add('hidden');
        dom.viewList.classList.remove('hidden');
        dom.viewToolDetail.classList.add('hidden');
        renderGrid(dom.listGrid, gridItems);
    }
}

function openTool(id) {
    const guide = state.guides.find(g => g._id === id);
    if (!guide) return;
    state.activeGuide = guide;
    renderView();
}

function backToToolList() {
    state.activeGuide = null;
    renderView();
}

function renderActiveTool() {
    const guide = state.activeGuide;
    dom.toolDocTitle.textContent = guide.filename;
    
    // Set Tool Label
    const labels = { summary: 'AI Summary', quiz: 'Quiz Generator', flashcards: 'Flashcards' };
    dom.toolActiveName.textContent = labels[state.view] || 'Study Tool';
    
    dom.toolContentArea.innerHTML = '';

    if (state.view === 'summary') {
        dom.toolContentArea.innerHTML = `
            <div class="bg-white border border-gray-100 p-12 rounded-[48px] text-lg font-medium leading-[1.8] text-gray-600 shadow-sm animate-in fade-in transition-all max-w-4xl mx-auto">
                ${guide.summary.replace(/\n/g, '<br><br>')}
            </div>
        `;
    } else if (state.view === 'quiz') {
        renderQuizInto(guide.quiz, dom.toolContentArea);
    } else if (state.view === 'flashcards') {
        renderCardsInto(guide.flashcards, dom.toolContentArea);
    }
}

function renderQuizInto(quiz, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto';
    
    quiz.forEach((q, idx) => {
        const qEl = document.createElement('div');
        qEl.className = 'bg-white rounded-[40px] border border-gray-50 p-10 shadow-sm space-y-6';
        qEl.innerHTML = `
            <p class="font-extrabold text-blue-600 text-[10px] uppercase tracking-widest">Question ${idx + 1}</p>
            <h4 class="text-lg font-bold leading-snug">${q.question}</h4>
            <div class="grid gap-3">
                ${q.options.map(opt => `
                    <button class="quiz-btn w-full text-left p-5 rounded-2xl border-2 border-gray-50 text-sm font-bold hover:border-blue-100 hover:bg-blue-50/30 transition-all flex justify-between items-center" 
                            onclick="checkAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.correctAnswer.replace(/'/g, "\\'")}')">
                        ${opt}
                        <span class="ico opacity-0"></span>
                    </button>
                `).join('')}
            </div>
        `;
        wrapper.appendChild(qEl);
    });
    container.appendChild(wrapper);
}

function renderCardsInto(cards, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto';
    
    cards.forEach(card => {
        const wrap = document.createElement('div');
        wrap.className = "w-full aspect-[4/3] perspective-1000 group cursor-pointer";
        wrap.onclick = () => wrap.querySelector('.card-inner').classList.toggle('rotate-y-180');
        wrap.innerHTML = `
            <div class="card-inner relative w-full h-full transition-all duration-500 transform-style-3d shadow-sm group-hover:shadow-xl rounded-[40px]">
                <div class="absolute inset-0 bg-white border-2 border-gray-50 rounded-[40px] p-10 flex items-center justify-center text-center backface-hidden">
                    <p class="text-xl font-bold">${card.question}</p>
                </div>
                <div class="absolute inset-0 bg-blue-600 text-white border-2 border-blue-600 rounded-[40px] p-10 flex items-center justify-center text-center backface-hidden rotate-y-180">
                    <p class="text-xl font-bold">${card.answer}</p>
                </div>
            </div>
        `;
        wrapper.appendChild(wrap);
    });
    container.appendChild(wrapper);
}

function renderFolders() {
    dom.foldersList.innerHTML = '';
    
    // Add "All Documents" pseudo-folder
    const allBtn = document.createElement('button');
    allBtn.className = `w-full flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${state.currentFolderId === 'root' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`;
    allBtn.onclick = () => setFolder('root');
    allBtn.innerHTML = `<div class="w-2 h-2 rounded-full border-2 border-current"></div> All Documents`;
    dom.foldersList.appendChild(allBtn);

    // Render children of current folder (or root if at root)
    const children = state.folders; // Show all folders in sidebar
    
    children.forEach(folder => {
        const btnContainer = document.createElement('div');
        btnContainer.className = "group flex items-center justify-between px-2 py-1 rounded-xl hover:bg-gray-50 transition-all";
        
        const btn = document.createElement('button');
        btn.className = `flex-1 flex items-center gap-2 text-xs font-bold ${state.currentFolderId === folder._id ? 'text-blue-600' : 'text-gray-500'}`;
        btn.onclick = () => setFolder(folder._id);
        btn.innerHTML = `<div class="w-2 h-2 ${state.currentFolderId === folder._id ? 'bg-blue-600' : 'bg-orange-400'} rounded-full"></div> ${folder.name}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = "opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1";
        deleteBtn.onclick = (e) => { e.stopPropagation(); confirmDeleteFolder(folder._id); };
        deleteBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
        
        btnContainer.appendChild(btn);
        btnContainer.appendChild(deleteBtn);
        dom.foldersList.appendChild(btnContainer);
    });
}

async function confirmDeleteFolder(id) {
    if (confirm("Delete this folder? This will NOT delete the files inside (they will move to Root).")) {
        try {
            await fetch(`/api/folders/${id}`, { method: 'DELETE' });
            await fetchFolders();
            if (state.currentFolderId === id) state.currentFolderId = 'root';
            renderView();
        } catch (e) { alert("Delete failed"); }
    }
}

function renderBreadcrumbs() {
    // We render into both main and tool breadcrumb containers
    const containers = [
        document.getElementById('breadcrumbs'),
        document.getElementById('breadcrumbs-tools')
    ].filter(c => c !== null);

    containers.forEach(container => {
        container.innerHTML = '';
        
        // 1. Back Button (only show if not at root)
        if (state.currentFolderId !== 'root') {
            const backBtn = document.createElement('button');
            backBtn.className = "mr-4 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all bg-blue-50 px-3 py-1.5 rounded-lg";
            backBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Back`;
            
            // Find parent ID
            const currentFolder = state.folders.find(f => f._id === state.currentFolderId);
            const parentId = currentFolder ? currentFolder.parentId : 'root';
            
            backBtn.onclick = () => setFolder(parentId);
            container.appendChild(backBtn);
            
            const divider = document.createElement('div');
            divider.className = "h-4 w-px bg-gray-200 mr-4";
            container.appendChild(divider);
        }

        // 2. Breadcrumbs
        const crumbs = [];
        if (state.currentFolderId !== 'root') {
            let current = state.folders.find(f => f._id === state.currentFolderId);
            while (current) {
                crumbs.unshift(current);
                current = state.folders.find(f => f._id === current.parentId);
            }
        }
        
        const homeLink = document.createElement('button');
        homeLink.className = "text-xs font-bold text-gray-400 hover:text-blue-600";
        homeLink.textContent = "Library";
        homeLink.onclick = () => setFolder('root');
        container.appendChild(homeLink);
        
        crumbs.forEach(c => {
            const sep = document.createElement('span');
            sep.className = "text-gray-300 text-xs mx-2";
            sep.textContent = "/";
            container.appendChild(sep);
            
            const link = document.createElement('button');
            link.className = "text-xs font-bold text-gray-400 hover:text-blue-600";
            link.textContent = c.name;
            link.onclick = () => setFolder(c._id);
            container.appendChild(link);
        });
    });
}

function renderGrid(container, list) {
    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = `<div class="col-span-3 py-20 text-center text-gray-400 font-bold">No documents in this folder.</div>`;
        return;
    }

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200 transition-all cursor-pointer group flex flex-col gap-6 animate-in fade-in duration-300";
        
        if (item.type === 'folder') {
            // FOLDER CARD
            card.onclick = () => setFolder(item._id);
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    </div>
                    <div class="bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Collection</div>
                </div>
                <div class="space-y-1">
                    <h4 class="font-extrabold text-[#1E293B] truncate text-lg">${item.name}</h4>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Open to Browse</p>
                </div>
                <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                   <span class="text-[10px] font-bold text-gray-300">Folder</span>
                   <button onclick="event.stopPropagation(); confirmDeleteFolder('${item._id}')" class="text-gray-300 hover:text-red-500 transition-colors p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        } else {
            // GUIDE CARD
            card.onclick = () => {
                if (['summary', 'quiz', 'flashcards'].includes(state.view)) {
                    openTool(item._id);
                } else {
                    openDetail(item._id);
                }
            };
            
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="w-12 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                       ${item.filename.split('.').pop().toUpperCase()}
                    </div>
                    <div class="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Processed</div>
                </div>
                <div class="space-y-1">
                    <h4 class="font-extrabold text-[#1E293B] truncate">${item.filename}</h4>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">${new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div class="flex -space-x-2">
                        <div class="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] font-bold text-blue-600">S</div>
                        <div class="w-6 h-6 rounded-full bg-orange-100 border border-white flex items-center justify-center text-[8px] font-bold text-orange-600">Q</div>
                        <div class="w-6 h-6 rounded-full bg-green-100 border border-white flex items-center justify-center text-[8px] font-bold text-green-600">C</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="event.stopPropagation(); promptMoveGuide('${item._id}')" class="text-gray-300 hover:text-blue-500 transition-colors p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        </button>
                        <button onclick="event.stopPropagation(); confirmDeleteGuide('${item._id}')" class="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }
        container.appendChild(card);
    });
}

async function confirmDeleteGuide(id) {
    if (confirm("Permanently delete this study guide? This cannot be undone.")) {
        try {
            await fetch(`/api/guides/${id}`, { method: 'DELETE' });
            await fetchGuides();
            renderView();
        } catch (e) { alert("Delete failed"); }
    }
}

async function promptMoveGuide(guideId) {
    const folderName = prompt("Enter folder name to move to (from your existing library):");
    if (!folderName) return;
    
    const target = state.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
    if (!target) {
        alert("Folder not found. Please create it first.");
        return;
    }

    try {
        const res = await fetch(`/api/guides/${guideId}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ folderId: target._id }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            await fetchGuides();
            renderView();
        }
    } catch (e) {
        alert("Failed to move guide.");
    }
}

// Drawer Logic
function openDetail(id) {
    const guide = state.guides.find(g => g._id === id);
    if (!guide) return;
    
    state.activeGuide = guide;
    dom.docTitle.textContent = guide.filename;
    dom.studyDrawer.classList.remove('hidden');
    dom.studyDrawer.classList.add('flex');
    
    // Auto-select tab based on view
    if (state.view === 'dashboard') setTab('chat');
    else setTab(state.view);
}

function closeDrawer() {
    dom.studyDrawer.classList.add('hidden');
    dom.studyDrawer.classList.remove('flex');
    state.activeGuide = null;
}

function setTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        btn.classList.add('text-gray-400', 'hover:text-gray-600');
    });

    const activeTab = document.getElementById(`tab-${tab}`);
    activeTab.classList.remove('text-gray-400', 'hover:text-gray-600');
    activeTab.classList.add('bg-white', 'text-gray-900', 'shadow-sm');

    renderTabContent();
}

function renderTabContent() {
    const guide = state.activeGuide;
    dom.panelContent.innerHTML = '';

    if (state.currentTab === 'chat') {
        document.getElementById('chat-input-container').classList.remove('hidden');
        dom.panelContent.innerHTML = `
            <div id="chat-messages" class="space-y-4 pb-20">
                <div class="bg-blue-50 p-6 rounded-[24px] text-sm font-medium leading-relaxed text-blue-900">
                    Hello! I've analyzed <b>${guide.filename}</b>. How can I help you understand this material today?
                </div>
            </div>
        `;
    } else if (state.currentTab === 'summary') {
        document.getElementById('chat-input-container').classList.add('hidden');
        dom.panelContent.innerHTML = `
            <div class="bg-white border border-gray-100 p-8 rounded-[32px] text-sm font-medium leading-[1.8] text-gray-600 shadow-sm animate-in fade-in transition-all">
                ${guide.summary.replace(/\n/g, '<br><br>')}
            </div>
        `;
    } else if (state.currentTab === 'quiz') {
        document.getElementById('chat-input-container').classList.add('hidden');
        renderQuiz(guide.quiz);
    } else if (state.currentTab === 'flashcards') {
        document.getElementById('chat-input-container').classList.add('hidden');
        renderCards(guide.flashcards);
    }
}

function renderQuiz(quiz) {
    const container = document.createElement('div');
    container.className = 'space-y-10 pb-20';
    
    quiz.forEach((q, idx) => {
        const qEl = document.createElement('div');
        qEl.className = 'bg-white rounded-[32px] border border-gray-50 p-8 shadow-sm space-y-6';
        qEl.innerHTML = `
            <p class="font-extrabold text-blue-600 text-[10px] uppercase tracking-widest">Question ${idx + 1}</p>
            <h4 class="text-base font-bold leading-snug">${q.question}</h4>
            <div class="grid gap-3">
                ${q.options.map(opt => `
                    <button class="quiz-btn w-full text-left p-4 rounded-2xl border-2 border-gray-50 text-sm font-bold hover:border-blue-100 hover:bg-blue-50/30 transition-all flex justify-between items-center" 
                            onclick="checkAnswer(this, '${opt}', '${q.correctAnswer}')">
                        ${opt}
                        <span class="ico opacity-0"></span>
                    </button>
                `).join('')}
            </div>
        `;
        container.appendChild(qEl);
    });
    dom.panelContent.appendChild(container);
}

function checkAnswer(btn, selected, correct) {
    const parent = btn.parentElement;
    const btns = parent.querySelectorAll('.quiz-btn');
    btns.forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('border-green-500', 'bg-green-50', 'text-green-700');
        btn.querySelector('.ico').innerHTML = '✓';
    } else {
        btn.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
        btn.querySelector('.ico').innerHTML = '✗';
        // Show correct
        btns.forEach(b => {
           if (b.textContent.trim() === correct) b.classList.add('border-green-500', 'text-green-700');
        });
    }
    btn.querySelector('.ico').classList.remove('opacity-0');
}

function renderCards(cards) {
    const container = document.createElement('div');
    container.className = 'space-y-6 flex flex-col items-center pb-20';
    
    cards.forEach(card => {
        const wrap = document.createElement('div');
        wrap.className = "w-full aspect-[4/3] perspective-1000 group cursor-pointer";
        wrap.onclick = () => wrap.querySelector('.card-inner').classList.toggle('rotate-y-180');
        wrap.innerHTML = `
            <div class="card-inner relative w-full h-full transition-all duration-500 transform-style-3d shadow-sm group-hover:shadow-xl rounded-[32px]">
                <div class="absolute inset-0 bg-white border-2 border-gray-50 rounded-[32px] p-8 flex items-center justify-center text-center backface-hidden">
                    <p class="text-lg font-bold">${card.question}</p>
                </div>
                <div class="absolute inset-0 bg-blue-600 text-white border-2 border-blue-600 rounded-[32px] p-8 flex items-center justify-center text-center backface-hidden rotate-y-180">
                    <p class="text-lg font-bold">${card.answer}</p>
                </div>
            </div>
        `;
        container.appendChild(wrap);
    });
    dom.panelContent.appendChild(container);
}

// Helpers
function updateLoader() {
    dom.globalLoader.classList.toggle('hidden', !state.loading);
    dom.globalLoader.classList.toggle('flex', state.loading);
}

function appendChat(type, msg) {
    const id = 'msg-' + Date.now();
    const container = document.getElementById('chat-messages');
    if (!container) return id; // Drawer closed
    const msgEl = document.createElement('div');
    msgEl.id = id;
    msgEl.className = type === 'user' ? 
        'bg-gray-900 text-white p-6 rounded-[24px] text-sm font-medium ml-12' : 
        'bg-gray-50 text-gray-700 p-6 rounded-[24px] text-sm font-medium mr-12 border border-gray-100';
    msgEl.textContent = msg;
    container.appendChild(msgEl);
    container.parentElement.scrollTo(0, container.scrollHeight);
    return id;
}

function updateChat(id, msg) {
    document.getElementById(id).textContent = msg;
}

// --- Authentication Handlers ---

function toggleAuth(showSignup) {
    if (showSignup) {
        dom.loginForm.classList.add('hidden');
        dom.signupForm.classList.remove('hidden');
        document.getElementById('auth-subtitle').textContent = "Create an account to get started.";
    } else {
        dom.loginForm.classList.remove('hidden');
        dom.signupForm.classList.add('hidden');
        document.getElementById('auth-subtitle').textContent = "Sign in to access your study lab.";
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    if (!email || !password) return alert("Please fill all fields");

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (res.ok) {
            state.user = data;
            localStorage.setItem('ace_user', JSON.stringify(data));
            updateUserUI();
            dom.authPortal.classList.add('hidden');
            await Promise.all([fetchGuides(), fetchFolders()]);
            renderView();
        } else {
            alert(data.error || "Login failed");
        }
    } catch (e) {
        alert("Server error");
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-pass').value;

    if (!name || !email || !password) return alert("Please fill all fields");

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (res.ok) {
            alert("Account created! Please sign in.");
            toggleAuth(false);
        } else {
            alert(data.error || "Signup failed");
        }
    } catch (e) {
        alert("Server error");
    }
}

function handleLogout() {
    localStorage.removeItem('ace_user');
    window.location.reload();
}

// --- Final Enhancements Logic ---

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ace_theme', isDark ? 'dark' : 'light');
}

async function downloadAsPdf() {
    if (!state.activeGuide) return;
    
    const element = document.getElementById('tool-content-area');
    const opt = {
        margin:       [10, 10],
        filename:     `${state.activeGuide.filename}_StudyGuide.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Style cleanup for PDF
    element.classList.add('p-8');
    
    try {
        await html2pdf().set(opt).from(element).save();
    } catch (e) {
        alert("PDF Export failed. Please try again.");
    } finally {
        element.classList.remove('p-8');
    }
}
