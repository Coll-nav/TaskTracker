const API_URL = '/api/tasks';
const icon = document.getElementById('f_i');
icon.onclick = (e) => {location.reload();};

async function loadTasks() {
    const res = await fetch(API_URL);
    const tasks = await res.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div id="n_f">No tasks found.</div>';
        return;
    }

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task';
        div.id = 'task-list-' + task.id;
        div.dataset.taskId = task.id;

        // Контейнер для тегов
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'task-tags-container';

        // Контейнер для основного содержимого
        const contentContainer = document.createElement('div');
        contentContainer.className = 'task-content';

        // Текст задачи
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.id = 'task-title-' + task.id;
        taskText.textContent = task.title;

        const input_all = document.createElement('input');
        input_all.id = `task-right-container-${task.id}`;
        input_all.type = 'text';
        input_all.placeholder = 'Введите...';

        // Контейнер для кнопок
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'task-buttons';

        
        const subBtn = document.createElement('button');
        subBtn.className = 'sub_btn';
        subBtn.id = 'sub-btn-' + task.id;
        subBtn.onclick = () => AddSubTask(task.id);
        subBtn.textContent = 'Добавить Подзадачу';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit_btn';
        editBtn.id = 'edit-btn-' + task.id;
        editBtn.onclick = () => editTask(task.id);
        editBtn.textContent = 'Изменить';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn_del';
        deleteBtn.onclick = () => deleteTask(task.id);
        deleteBtn.textContent = 'Удалить';

        const subListBtn = document.createElement('button');
        subListBtn.className = 'sub_list';
        subListBtn.onclick = () => loadSubtasks(task.id);
        subListBtn.textContent = 'Подзадачи';

        const commentListBtn = document.createElement('button');
        commentListBtn.className = 'sub_list';
        commentListBtn.id = 'cc';
        commentListBtn.onclick = () => addComment(task.id);
        commentListBtn.textContent = 'Добавить коментарий';

        const commentBtn = document.createElement('button');
        commentBtn.className = 'add_com';
        commentBtn.id = 'cc';
        commentBtn.onclick = () => loadComments(task.id);
        commentBtn.textContent = 'Комментарии';

        // добавляем кнопки
        buttonsContainer.appendChild(editBtn);
        buttonsContainer.appendChild(deleteBtn);
        buttonsContainer.appendChild(subBtn);
        buttonsContainer.appendChild(subListBtn);
        buttonsContainer.appendChild(commentListBtn);
        buttonsContainer.appendChild(commentBtn);

        // Собираем контент
        contentContainer.appendChild(taskText);
        contentContainer.appendChild(buttonsContainer);
        
        div.appendChild(tagsContainer);
        div.appendChild(contentContainer);
        div.appendChild(input_all);
        taskList.appendChild(div);

        // Проверяем статус задачи
        (async () => {
            try {
                const res = await fetch(`/api/subtasks/${task.id}`);
                const subtasks = await res.json();

                if (subtasks.length > 0) {
                    const allCompleted = subtasks.every(st => st.isDone);
                    if (allCompleted) {
                        div.classList.add('task-completed');
                        div.querySelector('.task-text').style.textDecoration = 'line-through';
                    }
                }
            } catch (e) {
                console.error('Ошибка:', e);
            }
        })();
    });

    if (typeof window.restoreTaskTags === 'function') {
        setTimeout(window.restoreTaskTags, 100);
    }
    
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const title = input.value.trim();
    if(!title) return;

    if (title.length > 30) {
        alert('Длина тега не должна превышать 30 символов');
        input.value = '';
        return;
    }

    await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: title}),
    });
    input.value ='';
    await loadTasks();
}

async function deleteTask(id){
    await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
    await loadTasks();
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
            loadTasks();
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

loadTasks();