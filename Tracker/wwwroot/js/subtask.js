const API_URL_SUB = '/api/subtasks';

const saveArr = {
    arrays: {},

    saveArray: function (array, taskId) {
        this.arrays[taskId] = array;
    },

    getArray: function (taskId) {
        return this.arrays[taskId];
    },

    cleanDiv: function (taskId) {
        const array = this.arrays[taskId];
        if(array && array.length > 0) {
            array.forEach(div => {
                if(div && div.remove) div.remove();
            })
            array.length = 0;
        }
    }
}

async function loadSubtasks(taskId) {
    const taskDiv = document.getElementById('task-list-' + taskId);

    const sb = taskDiv.querySelectorAll('.subtask');
    
    const cm = taskDiv.querySelectorAll('.comment-item');
    let flag = false;
    
    if(sb.length === 0 && cm.length > 0) {
        const oldComments = taskDiv.querySelectorAll('.comment-item, .sub_btn_b, .comment-buttons, .comments-container');
        oldComments.forEach(comment => comment.remove());
        flag = true;
    }

    //на повтороное нажатие кнопки
    const existingSubtasks = taskDiv.querySelectorAll('.subtask');
    if (existingSubtasks.length > 0) {
        return;
    }

    const oldSubtasks = taskDiv.querySelectorAll('.subtask');
    oldSubtasks.forEach(sub => sub.remove());

    const oldListClose = taskDiv.querySelector('.listClose');
    if (oldListClose) oldListClose.remove();

    const res = await fetch(`${API_URL_SUB}/${taskId}`);
    const subtasks = await res.json();
    const subtasksList = document.getElementById('task-list-' + taskId);
    
    if(subtasks.length === 0){
        const existingMsg = subtasksList.querySelector('.no-subtasks-msg');
        if(!existingMsg) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'no-subtasks-msg';
            msgDiv.textContent = '📭 Нет подзадач';
            msgDiv.style.padding = '10px';
            msgDiv.style.color = '#6b7280';
            msgDiv.style.fontStyle = 'italic';
            subtasksList.appendChild(msgDiv);

            const commentsContainer = subtasksList.querySelector('.comments-container');
            if (commentsContainer) {
                subtasksList.insertBefore(msgDiv, commentsContainer);
            } else {
                subtasksList.appendChild(msgDiv);
            }
        }
        return;
    }

    const subtaskDiv = [];

    subtasks.forEach(subtask => {
        const div = document.createElement('div');
        div.className = 'subtask';

        if(subtask.isDone){
            div.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = subtask.isDone;
        checkbox.onchange = () => StatusSubtask(taskId, subtask.subTaskId, checkbox);

        const span = document.createElement('span');
        span.className = 'sub-task-text';
        span.id = `subtask-${subtask.subTaskId}`;
        span.textContent = subtask.subTaskTitle;

        if (subtask.isDone) {
            span.style.textDecoration = 'line-through';
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'sub_btn_del';
        deleteBtn.onclick = () => DeleteSubTask(taskId, subtask.subTaskId);
        deleteBtn.textContent = '🗑️';

        div.appendChild(checkbox);
        div.appendChild(span);
        div.appendChild(deleteBtn);
        subtaskDiv.push(div);
    })
    
    // Очищаем subtasksList от старых элементов
    const oldContent = subtasksList.querySelectorAll('.subtask, .listClose, .subtask-separator');
    oldContent.forEach(el => el.remove());

// Создаем линию-разделитель
    const separator = document.createElement('div');
    separator.className = 'subtask-separator';
    subtasksList.appendChild(separator);

// Добавляем подзадачи
    subtaskDiv.forEach(div => {
        subtasksList.appendChild(div);
    });

    const ListClose = document.createElement('div');
    ListClose.className = 'listClose';
    ListClose.innerHTML = `Скрыть список подзадач`;
    ListClose.onclick = () => {
        clean(ListClose, taskId);
    }
    subtasksList.appendChild(ListClose);
    

// Удаляем старые комментарии и сообщения
    const oldComments = subtasksList.querySelectorAll('.comments-container, .comment-buttons, .comment-item, .no-comments-msg');
    oldComments.forEach(el => el.remove());


    if (flag) {
        await loadComments(taskId);
    }
    
    

    saveArr.saveArray(subtaskDiv, taskId);

    let count = 0;
    subtasks.forEach(subtask => {
        if(subtask.isDone){
            count++;
        }
    })

    if(flag){
        await loadComments(taskId);
    }

    const taskDiv2 = document.getElementById('task-list-' + taskId);
    const taskText = taskDiv2.querySelector('.task-text');

    const oldTime = taskDiv2.querySelector('.task-completed-time');
    if (oldTime) oldTime.remove();

    if(subtasks.length === count && subtasks.length > 0){
        taskDiv2.classList.add('task-completed');
        taskText.style.textDecoration = 'line-through';

        await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        const now = new Date();
        const timeDiv = document.createElement('div');
        timeDiv.className = 'task-completed-time';
        timeDiv.textContent = `✓ Выполнено: ${now.toLocaleString('ru-RU')}`;
        taskDiv2.appendChild(timeDiv);

    } else{
        taskDiv2.classList.remove('task-completed');
        taskText.style.textDecoration = 'none';

        await fetch(`/api/tasks/${taskId}/incomplete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
    }
}

async function StatusSubtask(taskId, subTaskId, checkbox) {
    const subtaskDiv = checkbox.closest('.subtask');
    const span = subtaskDiv.querySelector('.sub-task-text');

    const res = await fetch(`${API_URL_SUB}/${subTaskId}`, {
        method: 'PATCH',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({isDone: checkbox.checked}),
    });

    if(res.ok){
        if(checkbox.checked){
            subtaskDiv.classList.add('completed');
            span.style.textDecoration = 'line-through';
        } else{
            subtaskDiv.classList.remove('completed');
            span.style.textDecoration = 'none';
        }
    }

    await checkAllSubtasksCompleted(taskId);
}

async function checkAllSubtasksCompleted(taskId) {
    const res = await fetch(`${API_URL_SUB}/${taskId}`);
    const subtasks = await res.json();

    let completedCount = 0;
    subtasks.forEach(subtask => {
        if(subtask.isDone) completedCount++;
    });

    const taskDiv = document.getElementById('task-list-' + taskId);
    const taskText = taskDiv.querySelector('.task-text');

    const oldTime = taskDiv.querySelector('.task-completed-time');
    if (oldTime) oldTime.remove();

    if(subtasks.length === completedCount && subtasks.length > 0) {
        taskDiv.classList.add('task-completed');
        taskText.style.textDecoration = 'line-through';

        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok) {
            const data = await response.json();
            const timeDiv = document.createElement('div');
            timeDiv.className = 'task-completed-time';
            const date = new Date(data.completedAt);
            timeDiv.textContent = `✓ Выполнено: ${date.toLocaleString('ru-RU')}`;
            taskDiv.appendChild(timeDiv);
        }

    } else {
        taskDiv.classList.remove('task-completed');
        taskText.style.textDecoration = 'none';

        await fetch(`/api/tasks/${taskId}/incomplete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
    }
}

function clean(ListClose, taskId){
    const divs = saveArr.getArray(taskId);
    if(divs && divs.length > 0){
        divs.forEach((div) => {
            if(div && div.remove) div.remove();
        });
        divs.length = 0;
    }

    const taskDiv = document.getElementById(`task-list-${taskId}`);

    // Удаляем линию
    const separator = taskDiv.querySelector('.subtask-separator');
    if(separator) {
        separator.remove();
    }
    
    if(ListClose && ListClose.remove) {
        ListClose.remove();
    }
}

async function AddSubTask(taskId) {
    const input = document.getElementById(`task-top-container-${taskId}`);
    const text = input.value.trim();

    if(text === ""){
        return;
    }

    if (text.length > 70) {
        alert('Длина тега не должна превышать 70 символов');
        input.value = '';
        return;
    }

    const subTask = {
        subTaskTitle: text,
        isDone: false
    }

    await fetch(`${API_URL_SUB}/${taskId}/subtask`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(subTask)
    });

    input.value = '';
    saveArr.cleanDiv(taskId);
    const taskDiv = document.getElementById(`task-list-${taskId}`);
    const noMsg = taskDiv.querySelector('.no-subtasks-msg');
    if (noMsg) noMsg.remove();
    await loadSubtasks(taskId);
}

async function DeleteSubTask(taskId, subTaskId) {
    await fetch(`${API_URL_SUB}/${subTaskId}`, {method: 'DELETE'});
    saveArr.cleanDiv(taskId);
    await loadSubtasks(taskId);
}