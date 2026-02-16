const API_URL = '/api/tasks';
const icon =document.getElementById('f_i');
icon.onclick = (e) => {location.reload();};
async function loadTasks() {  //асинхронный метод просмотра всех задач
    const res = await fetch(API_URL); //запрос на получение информации с бд и ждем
    const tasks = await res.json(); //парсим весь текст в формат json
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; //очищаем контейнер перед добавлением каждой задачи
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div id="n_f">No tasks found.</div>';
        return;
    }
    
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task';
        div.innerHTML = `
        <span class="task-text" id="task-title-${task.id}">${task.title}</span>
        <button class="edit_btn" id="edit-btn-${task.id}" onclick="editTask(${task.id})">Изменить</button> 
        <button class="btn_del" onclick="deleteTask(${task.id})">Удалить</button>`;
        taskList.appendChild(div);
    })
}
async function addTask(){ //функция для добавления задачи
    const input = document.getElementById('taskInput');
    const title = input.value.trim(); //считывает текст, удаляя пробелы вначале и в конце
    if(!title) return;
    //отправляем новую задачу на сервер
    await fetch(API_URL, { 
        method: 'POST', //запрос для создания новой задачи
        headers: {'Content-Type': 'application/json'}, //отправляем json
        body: JSON.stringify({title: title}), //данные в формате json
    })
    input.value ='';
    await loadTasks();
}
//удаляем задачу с сервера
async function deleteTask(id){
        await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
        await loadTasks();
}

// считываем текст с заметок
function getTaskTitle(id){
    return document.querySelector(`#task-title-${id}`).innerText; //innerText - получает текст из заметки
}
//объявляем ошибку в самом браузере 
function showMessage(msg){
    alert(msg);
}
//функция обновления статуса задания
function updateTaskStatus(id, isTrue, Title){
    const title = getTaskTitle(id);
    //метод запроса изменения текста по id 
    fetch(`/api/tasks/${id}` , {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id, title: Title, isTrue: isTrue}),
    })
    .then (res => { //после того как обещание завершилось, обрабатываем ответ
        if(!res.ok) throw new Error('Ошибка при обновлении');
        loadTasks();
        })
    .catch(error => {
        showMessage(error.message);
    });
    return document.querySelector(`#task-title-${id}`).innerText;
}
//функция по изменению текста
function editTask(id){
    const titleElement = document.querySelector(`#task-title-${id}`);
    const currentTitle = titleElement.innerText;
    titleElement.innerHTML = `<input type="text" id="edit-input-${id}" value="${currentTitle}">`;
    const editBtn = document.querySelector(`#edit-btn-${id}`);
    editBtn.innerText = 'Сохранить';
    editBtn.classList.add('save_mode');
    editBtn.onclick = () => SaveTask(id);
}
//функция по сохранению текста
function SaveTask(id){
    const input = document.querySelector(`#edit-input-${id}`); //ищет первый элемент, который соотвеетсвует данному селектору
    const newTitle = input.value.trim();
    
    if(newTitle.trim() === ''){
        showMessage('You must enter title');
        return;
    }
    updateTaskStatus(id, false, newTitle);
}
loadTasks();
