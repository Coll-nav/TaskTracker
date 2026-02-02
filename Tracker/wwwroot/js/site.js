const API_URL = '/api/tasks';

async function loadTasks() {
    const res = await fetch(API_URL);
    const tasks = await res.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    /*if (tasks.length === 0) {
        taskList.innerHTML = '<div>No tasks found.</div>';
        return;
    }*/
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task';
        div.innerHTML = `${task.title} 
        <button onclick="deleteTask(${task.id})">Удалить</button>`;
        taskList.appendChild(div);
    })
}
async function addTask(){
    const input = document.getElementById('taskInput');
    const title = input.value.trim(); //считывает текст, удаляя пробелы вначале и в конце
    if(!title) return;
    await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: title}),
    })
    input.value ='';
    await loadTasks();
}
async function deleteTask(id){
    await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
    await loadTasks();
}
loadTasks();