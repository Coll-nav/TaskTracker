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
        if(array.length > 0 && array) {
            array.forEach(div => {
                if(div && div.remove) div.remove();
            })
            array.length = 0;
        }
    }
}

async function loadSubtasks(taskId) {
    
    const res = await fetch(`${API_URL_SUB}/${taskId}`);
    const subtasks = await res.json();
    const subtasksList = document.getElementById('task-list-' + taskId);
    //subtasksList.innerHTML = '';
    
    if(subtasks.length === 0){
        subtasksList.innerHTML = '<div>Нет подзадач</div>';
        return;
    }
    
    const subtaskDiv = [];
    const ListClose = document.createElement('button');
    subtasks.forEach(subtask => {
        const div = document.createElement('div');
        div.className = 'subtask';
        div.innerHTML = '';
        div.innerHTML = `
        <input type="checkbox"/> 
        <span class="sub-task-text" id="${subtask.id}">${subtask.subTaskTitle}</span>
        <button class="sub_btn_del" onclick="DeleteSubTask(${taskId}, ${subtask.subTaskId})">Удалить</button>`;
        subtasksList.appendChild(div);
        subtaskDiv.push(div);
    })
    saveArr.saveArray(subtaskDiv, taskId);
    
    ListClose.className = 'listClose';
    ListClose.innerHTML = `Скрыть список подзадач`;
    const divs = saveArr.getArray(taskId);
    ListClose.onclick = () => {
        clean(ListClose, taskId);
    }
    subtasksList.appendChild(ListClose);
}

//обдумать вариант с добавлением задачи есть баги, но нет четкой реализии, мб css поможет но не точно 

function clean(ListClose, taskId){
    const divs = saveArr.getArray(taskId);
    if(divs){
        divs.forEach((div) => {
            div.remove();
        })
        divs.length = 0;
    }
        ListClose.remove();
}

async function AddSubTask(taskId) {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();
    
    if(text === ""){
        return;
    }
    
    const subTask = {
        subTaskTitle: text,
        isDone: false
    }
    
    await fetch( `${API_URL_SUB}/${taskId}/subtask`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(subTask)
    });
    input.value = '';
    //const ListClose = document.getElementsByClassName('listClose');
    saveArr.cleanDiv(taskId);
    await loadSubtasks(taskId);
}

async function DeleteSubTask(taskId, subTaskId) {
    await fetch(`${API_URL_SUB}/${subTaskId}`, {method: 'DELETE'});
    const container = document.getElementById('task-list-' + taskId);
    const subtasks = container.querySelectorAll('.subtask');
    const btn = container.querySelector('.listClose');
    if(subtasks) subtasks.forEach(subtask => {subtask.remove();});
    if(btn) btn.remove();
    await loadSubtasks(taskId);
}