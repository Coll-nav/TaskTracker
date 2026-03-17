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
    const oldSubtasks = taskDiv.querySelectorAll('.subtask');
    oldSubtasks.forEach(sub => sub.remove());

    const oldListClose = taskDiv.querySelector('.listClose');
    if (oldListClose) oldListClose.remove();

    const res = await fetch(`${API_URL_SUB}/${taskId}`);
    const subtasks = await res.json();
    const subtasksList = document.getElementById('task-list-' + taskId);
    
    if(subtasks.length === 0){
        subtasksList.innerHTML = `<div>Нет подзадач</div>
        <button class="sub_btn" onclick="loadTasks()"><-----</button>`;
        return;
    }

    const subtaskDiv = [];
    const ListClose = document.createElement('button');

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
        deleteBtn.textContent = 'Удалить';

        div.appendChild(checkbox);
        div.appendChild(span);
        div.appendChild(deleteBtn);
        subtasksList.appendChild(div);
        subtaskDiv.push(div);
    })
    saveArr.saveArray(subtaskDiv, taskId);

    let count = 0;
    subtasks.forEach(subtask => {
        if(subtask.isDone){
            count++;
        }
    })

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

    ListClose.className = 'listClose';
    ListClose.innerHTML = `Скрыть список подзадач`;
    ListClose.onclick = () => {
        clean(ListClose, taskId);
    }
    subtasksList.appendChild(ListClose);
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

    // ИСПРАВЛЕНО: убрал loadSubtasks отсюда, чтобы избежать повторения 
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

    // Удаляем старую метку времени
    const oldTime = taskDiv.querySelector('.task-completed-time');
    if (oldTime) oldTime.remove();

    if(subtasks.length === completedCount && subtasks.length > 0) {
        taskDiv.classList.add('task-completed');
        taskText.style.textDecoration = 'line-through';

        // Отправляем на сервер
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok) {
            const data = await response.json();
            // Показываем время с сервера
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
    if(ListClose && ListClose.remove) {
        ListClose.remove();
    }
}

async function AddSubTask(taskId) {
    const input = document.getElementById(`task-right-container-${taskId}`);
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
    await loadSubtasks(taskId);
}

async function DeleteSubTask(taskId, subTaskId) {
    await fetch(`${API_URL_SUB}/${subTaskId}`, {method: 'DELETE'});
    saveArr.cleanDiv(taskId);
    await loadSubtasks(taskId);
}