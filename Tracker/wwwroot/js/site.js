const API_URL = '/api/tasks';
const token = localStorage.getItem('token');
if (!token && window.location.pathname !== '/auth.html') {
    window.location.href = '/auth.html';
}
let currentSort = localStorage.getItem('taskSort') || null;
showUserName();
const icon = document.getElementById('f_i');
icon.onclick = (e) => {location.reload();};

// Функция сворачивания/разворачивания
function toggleTaskDetails(taskId) {
    const taskDiv = document.getElementById(`task-list-${taskId}`);
    const details = taskDiv.querySelector('.task-details');
    const expandBtn = taskDiv.querySelector('.expand-btn');
    const ListClose = taskDiv.querySelector('.listClose');

    if (details.style.display === 'none' || !details.style.display) {
        details.style.display = 'block';
        expandBtn.classList.add('expanded');
    } else {
        details.style.display = 'none';
        expandBtn.classList.remove('expanded');
        hideComments(taskId);
        clean(ListClose, taskId);

        const noSubtasks = taskDiv.querySelectorAll('.no-subtasks-msg');
        const noComments = taskDiv.querySelectorAll('.no-comments-msg');
        noSubtasks.forEach(msg => msg.remove());
        noComments.forEach(msg => msg.remove());
    }
}
function showUserName() {
    const username = localStorage.getItem('username');
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && username) {
        userNameSpan.textContent = `👤 ${username}`;
    }
}
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Ошибка при выходе:', err);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    window.location.href = '/index.html';
}

async function loadTasks() {
    const res = await fetch(API_URL, {
        credentials: 'include'
    });

    if(res.status === 401){
        alert("very bad");
        return;
    }
    let tasks = await res.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    if(currentSort){
        tasks = sortTasks(tasks, currentSort);
    }

    if (tasks.length === 0) {
        taskList.innerHTML = '<div id="n_f">No tasks found.</div>';
        return;
    }

    if (tasks.length === 0) {
        taskList.innerHTML = '<div id="n_f">No tasks found.</div>';
        return;
    }

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task';
        taskCard.id = 'task-list-' + task.id;
        taskCard.dataset.taskId = task.id;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'task-tags-container';
        taskCard.appendChild(tagsContainer);

        const topRow = document.createElement('div');
        topRow.className = 'task-top-row';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.id = 'task-title-' + task.id;
        taskText.textContent = task.title;

        const topButtons = document.createElement('div');
        topButtons.className = 'task-top-buttons';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit_btn';
        editBtn.id = 'edit-btn-' + task.id;
        editBtn.textContent = 'Изменить';
        editBtn.onclick = () => editTask(task.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn_del';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.onclick = () => deleteTask(task.id);

        topButtons.appendChild(editBtn);
        topButtons.appendChild(deleteBtn);

        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.innerHTML = '▼';
        expandBtn.onclick = () => toggleTaskDetails(task.id);

        topRow.appendChild(taskText);
        topRow.appendChild(topButtons);
        topRow.appendChild(expandBtn);
        taskCard.appendChild(topRow);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'task-details';
        detailsDiv.style.display = 'none';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'task-content';

        const input_1 = document.createElement('input');
        input_1.id = `task-top-container-${task.id}`;
        input_1.type = 'text';
        input_1.placeholder = 'Добавить Подзадачу...';

        const input_2 = document.createElement('input');
        input_2.id = `task-bottom-container-${task.id}`;
        input_2.type = 'text';
        input_2.placeholder = 'Введите Комментарий...';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'task-buttons';

        const subBtn = document.createElement('button');
        subBtn.className = 'sub_btn';
        subBtn.id = 'sub-btn-' + task.id;
        subBtn.onclick = () => AddSubTask(task.id);
        subBtn.textContent = 'Добавить Подзадачу';

        const subListBtn = document.createElement('button');
        subListBtn.className = 'sub_list';
        subListBtn.onclick = () => loadSubtasks(task.id);
        subListBtn.textContent = 'Подзадачи';

        const commentListBtn = document.createElement('button');
        commentListBtn.className = 'sub_list_1';
        commentListBtn.id = 'cc';
        commentListBtn.onclick = () => addComment(task.id);
        commentListBtn.textContent = 'Добавить комментарий';

        const commentBtn = document.createElement('button');
        commentBtn.className = 'add_com';
        commentBtn.id = 'cc';
        commentBtn.onclick = () => loadComments(task.id);
        commentBtn.textContent = 'Комментарии';

        const file_btn = document.createElement('button');
        file_btn.className = 'add_file';
        file_btn.id = 'file-btn';
        file_btn.onclick = () => openFileModal(task.id);
        file_btn.textContent = '📎 Прикрепить ФАЙЛ';

        buttonsContainer.appendChild(subBtn);
        buttonsContainer.appendChild(subListBtn);
        buttonsContainer.appendChild(commentListBtn);
        buttonsContainer.appendChild(commentBtn);
        buttonsContainer.appendChild(file_btn);

        contentContainer.appendChild(buttonsContainer);

        detailsDiv.appendChild(contentContainer);
        detailsDiv.appendChild(input_1);
        detailsDiv.appendChild(input_2);

        if (task.createdAt) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'task-created-time';
            const date = new Date(task.createdAt);
            timeDiv.textContent = `🕒 Создано: ${date.toLocaleString('ru-RU')}`;
            detailsDiv.appendChild(timeDiv);
        }

        if (task.deadline){
            const deadlineDiv = document.createElement('div');
            deadlineDiv.className = 'task-deadline';
            const date = new Date(task.deadline);
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

            const now = new Date();

            if (date < now) {
                deadlineDiv.classList.add('deadline-overdue');
                taskCard.classList.add('deadline-expired');
            }

            deadlineDiv.textContent = `📅 Дедлайн: ${localDate.toLocaleString('ru-RU')}`;
            detailsDiv.appendChild(deadlineDiv);

            const timerSpan = document.createElement('span');
            timerSpan.className = 'timer';
            function UpdateTimer(){
                const now = new Date();
                const diff = localDate - now;

                if(diff < 0){
                    timerSpan.textContent = ' ⏰ Срок истек!';
                    timerSpan.classList.add('deadline-overdue');
                    clearInterval(timerSpan.timerInterval);
                } else{
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (86400000)) / (3600000));
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);

                    let timerText = ' ⏳ Осталось: ';
                    if (days > 0) timerText += `${days}д `;
                    timerText += `${hours}ч ${minutes}м ${seconds}c`;
                    timerSpan.textContent = timerText;

                    if (days === 0 && hours < 24) {
                        timerSpan.classList.add('deadline-soon');
                    }
                }
            }

            UpdateTimer();
            const timerInterval = setInterval(UpdateTimer, 1000);
            timerSpan.timerInterval = timerInterval;
            detailsDiv.appendChild(timerSpan);
        }

        (async () => {
            try {
                const res = await fetch(`/api/subtasks/${task.id}`);
                const subtasks = await res.json();

                const detailsDiv = taskCard.querySelector('.task-details');

                if (subtasks.length > 0) {
                    const allCompleted = subtasks.every(st => st.isDone);
                    if (allCompleted) {
                        taskCard.classList.add('task-completed');
                        taskCard.querySelector('.task-text').style.textDecoration = 'line-through';

                        const timer = detailsDiv.querySelector('.timer');
                        if (timer) {
                            if (timer.timerInterval) clearInterval(timer.timerInterval);
                            timer.remove();
                        }
                    }
                }
            } catch (e) {
                console.error('Ошибка:', e);
            }
        })();

        taskCard.appendChild(detailsDiv);
        taskList.appendChild(taskCard);
    });

    if (currentSort) {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            if (btn.getAttribute('data-sort') === currentSort) {
                btn.classList.add('active');
            }
        });
    }

    if (typeof window.restoreTaskTags === 'function') {
        setTimeout(window.restoreTaskTags, 100);
    }
}


async function addTask() {
    const input = document.getElementById('taskInput');
    const title = input.value.trim();
    if(!title){
        return
    }
    if (title.length > 35) {
        alert('Длина тега не должна превышать 30 символов');
        input.value = '';
        return;
    }

    const deadlineInput = document.getElementById('modalTaskDeadline');
    const deadline = deadlineInput ? deadlineInput.value : null;

    if (!deadline) {
        alert("Пожалуйста, введите дату и время дедлайна");
        return;
    }

    const tempId = Date.now();
    localStorage.setItem(`deadline_${tempId}`, deadline);

    const task = {
        title: title,
        createdAt: new Date().toISOString(),
        deadline: new Date(deadline).toISOString()
    }
    let url = API_URL
    if(current && current !== ""){
        url = `/api/auth/users/${current}/tasks`;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(task),
        credentials: 'include'
    });
    input.value ='';
    if (deadlineInput) deadlineInput.value = '';
    closeModal();
    
    if(res.ok){
        await loadUserTasks(current);
    }else{
        await loadTasks();
    }
}

async function deleteTask(id){
    await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
    if(current && current !== ""){
        await loadUserTasks(current);
    }else {
        await loadTasks();
    }
}

function showMessage(msg){
    alert(msg);
}

function updateTaskStatus(id, isTrue, Title){
    fetch(`/api/tasks/${id}` , {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id, title: Title, isTrue: isTrue}),
    })
        .then(res => {
            if(!res.ok) throw new Error('Ошибка при обновлении');
            if (current && current !== "") {
                loadUserTasks(current);
            } else {
                loadTasks();
            }
        })
        .catch(error => {
            showMessage(error.message);
        });
}

function editTask(id){
    const titleElement = document.querySelector(`#task-title-${id}`);
    const currentTitle = titleElement.innerText;
    titleElement.innerHTML = `<input type="text" id="edit-input-${id}" value="${currentTitle}" style="font-size:1rem; padding:2px;">`;
    const editBtn = document.querySelector(`#edit-btn-${id}`);
    editBtn.innerText = 'Сохранить';
    editBtn.classList.add('save_mode');
    editBtn.onclick = () => SaveTask(id);
}

function SaveTask(id){
    const input = document.querySelector(`#edit-input-${id}`);
    const newTitle = input.value.trim();

    if(newTitle === ''){
        showMessage('You must enter title');
        return;
    }
    updateTaskStatus(id, false, newTitle);
}

function openCreateModal() {
    const input = document.getElementById('taskInput');
    const title = input.value.trim();
    if (!title) {
        alert("Необходимо ввести задачу!");
        return;
    }

    const div = document.getElementById('label_tit');
    if (!div) {
        console.error('Элемент label_tit не найден');
        return;
    }

    div.innerHTML = `
        <label>Название задачи: </label>
        <h4>${title}</h4>
    `;

    const taskModal = document.getElementById('taskModal');
    if (taskModal) taskModal.style.display = 'flex';

    const deadlineInput = document.getElementById('modalTaskDeadline');
    if (deadlineInput) deadlineInput.value = '';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function sortTasksBy(type) {
    if (currentSort === type) {
        currentSort = null;
        localStorage.removeItem('taskSort');
        document.querySelectorAll('.srt-btn').forEach(btn => btn.classList.remove('active'));
    } else {
        currentSort = type;
        localStorage.setItem('taskSort', type);
        document.querySelectorAll('.srt-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
    loadTasks();
}

function sortTasks(tasks, sortType){
    const sorted = [...tasks];

    switch(sortType){
        case 'date':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'deadline':
            sorted.sort((a, b) => {
                const now = new Date();
                const aDeadline = a.isDonedAt ? new Date(a.isDonedAt) : null;
                const bDeadline = b.isDonedAt ? new Date(b.isDonedAt) : null;

                const aExpired = aDeadline && aDeadline < now;
                const bExpired = bDeadline && bDeadline < now;

                if (aExpired === bExpired) {
                    if (!aDeadline && !bDeadline) return 0;
                    if (!aDeadline) return 1;
                    if (!bDeadline) return -1;
                    return aDeadline - bDeadline;
                }

                if (aExpired) return 1;
                if (bExpired) return -1;

                return 0;
            });
            break;
        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    return sorted;
}

async function loadFileList(taskId){
    const container = document.getElementById(`fileList-${taskId}`)
    if(!container) return;

    try{
        const res = await fetch(`${API_URL}/${taskId}/files`, {});
        const files = await res.json();

        if(files.length === 0){
            container.innerHTML = '<div class="no-files">Нет прикрепленных файлов</div>';
            return;
        }

        container.innerHTML = files.map(file => `
            <div class="file-item">
                <span>📄 ${file.fileName}</span>
                <span class="file-size">(${(file.fileSize / 1024).toFixed(0)} KB)</span>
                <div class="file-actions">
                    <button onClick="downloadFile(${file.id})" class="download-btn">📥 Скачать</button>
                    <button onClick="deleteFile(${file.id}, ${taskId})" class="delete-btn">🗑️</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        alert('Ошибка загрузки файлов:');
    }
}

function openFileModal(taskId){
    const oldModal = document.querySelector('.file-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'file-modal';
    modal.innerHTML = `
    <div class= "file-modal-content">
        <h3>📎 Прикрепить PDF</h3>
        <div class="file-upload-area">
            <input type="file" id="fileInput-${taskId}" accept=".pdf">
            <button onclick="uploadFile(${taskId})">Загрузить</button>
        </div>
        <div>
        <div id="fileList-${taskId}" class="file-list">
                <div class="loading">Загрузка...</div>
            </div>
            <button class="close-modal-btn" onclick="closeFileModal()">Закрыть</button>
        </div>
    </div>
    `;
    document.body.appendChild(modal);
    loadFileList(taskId);
}

function closeFileModal() {
    const modal = document.querySelector('.file-modal');
    if (modal) modal.remove();
}

async function uploadFile(taskId){
    const input = document.getElementById(`fileInput-${taskId}`);
    const file = input.files[0];

    if(!file){
        alert('Выберите файл');
        return;
    }
    if (file.type !== 'application/pdf') {
        alert('Можно загружать только PDF файлы');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert('Файл не должен превышать 10MB');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try{
        const res = await fetch(`${API_URL}/${taskId}/files`, {
            method: 'POST',
            body: formData,
        })

        if (res.ok) {
            input.value = '';
            loadFileList(taskId);
            alert('Файл загружен');
        }else{
            alert('Ошибка загрузки');
        }
    } catch (err){
        console.log('Ошибка: ',err);
    }
}

function downloadFile(fileId){
    window.open(`${API_URL}/files/${fileId}`, '_blank');
}

async function deleteFile(fileId, taskId) {
    if(!confirm('Удалить файл ?')) return;

    try{
        const res = await fetch(`${API_URL}/files/${fileId}`, {
            method: 'DELETE'
        })

        if(res.ok){
            loadFileList(taskId);
            alert('Файл удален');
        }else{
            alert('Ошибка удаления');
        }

    }catch(error){
        console.error('Ошибка:', error);
    }
}

async function loadUsers(){
    if(localStorage.getItem('role') !== 'admin') return;

    const res = await fetch(`/api/auth/users`, {
        credentials: 'include'
    });

    if (res.ok) {
        const users = await res.json();
        const select = document.getElementById('userSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Все пользователи --</option>';

        users.forEach(user => {
            select.innerHTML += `<option value="${user.id}">👤 ${user.username} (${user.role})</option>`;
        });
    }
}

let current = null;
async function onUserSelect() {
    const select = document.getElementById('userSelect');
    current = select.value;

    if (current === "") {
        await loadTasks();
    } else {
        await loadUserTasks(current);
    }
}

async function loadUserTasks(userId) {
    const res = await fetch(`/api/auth/users/${userId}/tasks`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
    });

    if (res.ok) {
        const tasks = await res.json();
        renderTasks(tasks);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task';
        taskCard.id = 'task-list-' + task.id;
        taskCard.dataset.taskId = task.id;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'task-tags-container';
        taskCard.appendChild(tagsContainer);

        const topRow = document.createElement('div');
        topRow.className = 'task-top-row';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.id = 'task-title-' + task.id;
        taskText.textContent = task.title;

        const topButtons = document.createElement('div');
        topButtons.className = 'task-top-buttons';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit_btn';
        editBtn.id = 'edit-btn-' + task.id;
        editBtn.textContent = 'Изменить';
        editBtn.onclick = () => editTask(task.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn_del';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.onclick = () => deleteTask(task.id);

        topButtons.appendChild(editBtn);
        topButtons.appendChild(deleteBtn);

        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.innerHTML = '▼';
        expandBtn.onclick = () => toggleTaskDetails(task.id);

        topRow.appendChild(taskText);
        topRow.appendChild(topButtons);
        topRow.appendChild(expandBtn);
        taskCard.appendChild(topRow);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'task-details';
        detailsDiv.style.display = 'none';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'task-content';

        const input_1 = document.createElement('input');
        input_1.id = `task-top-container-${task.id}`;
        input_1.type = 'text';
        input_1.placeholder = 'Добавить Подзадачу...';

        const input_2 = document.createElement('input');
        input_2.id = `task-bottom-container-${task.id}`;
        input_2.type = 'text';
        input_2.placeholder = 'Введите Комментарий...';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'task-buttons';

        const subBtn = document.createElement('button');
        subBtn.className = 'sub_btn';
        subBtn.id = 'sub-btn-' + task.id;
        subBtn.onclick = () => AddSubTask(task.id);
        subBtn.textContent = 'Добавить Подзадачу';

        const subListBtn = document.createElement('button');
        subListBtn.className = 'sub_list';
        subListBtn.onclick = () => loadSubtasks(task.id);
        subListBtn.textContent = 'Подзадачи';

        const commentListBtn = document.createElement('button');
        commentListBtn.className = 'sub_list_1';
        commentListBtn.id = 'cc';
        commentListBtn.onclick = () => addComment(task.id);
        commentListBtn.textContent = 'Добавить комментарий';

        const commentBtn = document.createElement('button');
        commentBtn.className = 'add_com';
        commentBtn.id = 'cc';
        commentBtn.onclick = () => loadComments(task.id);
        commentBtn.textContent = 'Комментарии';

        const file_btn = document.createElement('button');
        file_btn.className = 'add_file';
        file_btn.id = 'file-btn';
        file_btn.onclick = () => openFileModal(task.id);
        file_btn.textContent = '📎 Прикрепить ФАЙЛ';

        buttonsContainer.appendChild(subBtn);
        buttonsContainer.appendChild(subListBtn);
        buttonsContainer.appendChild(commentListBtn);
        buttonsContainer.appendChild(commentBtn);
        buttonsContainer.appendChild(file_btn);

        contentContainer.appendChild(buttonsContainer);

        detailsDiv.appendChild(contentContainer);
        detailsDiv.appendChild(input_1);
        detailsDiv.appendChild(input_2);

        if (task.createdAt) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'task-created-time';
            const date = new Date(task.createdAt);
            timeDiv.textContent = `🕒 Создано: ${date.toLocaleString('ru-RU')}`;
            detailsDiv.appendChild(timeDiv);
        }

        if (task.deadline){
            const deadlineDiv = document.createElement('div');
            deadlineDiv.className = 'task-deadline';
            const date = new Date(task.deadline);
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

            const now = new Date();

            if (date < now) {
                deadlineDiv.classList.add('deadline-overdue');
                taskCard.classList.add('deadline-expired');
            }

            deadlineDiv.textContent = `📅 Дедлайн: ${localDate.toLocaleString('ru-RU')}`;
            detailsDiv.appendChild(deadlineDiv);

            const timerSpan = document.createElement('span');
            timerSpan.className = 'timer';
            function UpdateTimer(){
                const now = new Date();
                const diff = localDate - now;

                if(diff < 0){
                    timerSpan.textContent = ' ⏰ Срок истек!';
                    timerSpan.classList.add('deadline-overdue');
                    clearInterval(timerSpan.timerInterval);
                } else{
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (86400000)) / (3600000));
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);

                    let timerText = ' ⏳ Осталось: ';
                    if (days > 0) timerText += `${days}д `;
                    timerText += `${hours}ч ${minutes}м ${seconds}c`;
                    timerSpan.textContent = timerText;

                    if (days === 0 && hours < 24) {
                        timerSpan.classList.add('deadline-soon');
                    }
                }
            }

            UpdateTimer();
            const timerInterval = setInterval(UpdateTimer, 1000);
            timerSpan.timerInterval = timerInterval;
            detailsDiv.appendChild(timerSpan);
        }

        (async () => {
            try {
                const res = await fetch(`/api/subtasks/${task.id}`);
                const subtasks = await res.json();

                const detailsDiv = taskCard.querySelector('.task-details');

                if (subtasks.length > 0) {
                    const allCompleted = subtasks.every(st => st.isDone);
                    if (allCompleted) {
                        taskCard.classList.add('task-completed');
                        taskCard.querySelector('.task-text').style.textDecoration = 'line-through';

                        const timer = detailsDiv.querySelector('.timer');
                        if (timer) {
                            if (timer.timerInterval) clearInterval(timer.timerInterval);
                            timer.remove();
                        }
                    }
                }
            } catch (e) {
                console.error('Ошибка:', e);
            }
        })();

        taskCard.appendChild(detailsDiv);
        taskList.appendChild(taskCard);
    });
}


loadTasks();
document.addEventListener('DOMContentLoaded', function() {
    if (currentSort) {
        const btn = document.querySelector(`.sort-btn[data-sort="${currentSort}"]`);
        if (btn) {
            btn.classList.add('active');
        }
    }
    if (localStorage.getItem('role') === 'admin') {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            loadUsers();
        }
    }
});