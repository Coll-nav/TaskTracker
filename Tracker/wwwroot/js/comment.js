const API_URL_COM = '/api/comments';

async function loadComments(taskId) {
    const res = await fetch(`${API_URL_COM}/${taskId}`);
    const comments = await res.json();
    const listComments = document.getElementById('task-list-' + taskId);

    //на повтороное нажатие кнопки
    const existingComments = listComments.querySelectorAll('.comment-item');
    if (existingComments.length > 0) {
        return;
    }

    if (comments.length === 0) {
        listComments.innerHTML = `<p class="no-comments">Пока нет комментариев</p> 
        <button class="sub_btn" onclick="loadTasks(${taskId})"><-----</button>`;
    } else {
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            commentDiv.innerHTML = `
                <p>${comment.commentText}</p>
                <small>${new Date(comment.createdAt).toLocaleString('ru-RU', {
                    timeZone: 'Europe/Moscow'
                })} </small>`;
            listComments.appendChild(commentDiv);
        });
        
        const del = document.createElement('button');
        del.className = 'sub_btn';
        del.id = 'bb';
        del.onclick = () => deleteComment(taskId);
        del.textContent = 'Очистить список комментариев';

        const back = document.createElement('button');
        back.className = 'sub_btn';
        back.id = 'bb';
        back.onclick = () => hideComments(taskId);
        back.textContent = 'Закрыть';
        
        listComments.appendChild(del);
        listComments.appendChild(back);
    }
}

async function addComment(taskId) {
    
    const input = document.getElementById(`task-right-container-${taskId}`);
    const text = input.value.trim();
    
    await fetch(`${API_URL_COM}/${taskId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({commentText: text})
    });
    
    input.value = '';

}

async function deleteComment(taskId) {
    await fetch(`${API_URL_COM}/${taskId}`, {method: 'DELETE'});
    
    const task = document.getElementById(`task-list-${taskId}`);
    const comments = task.querySelectorAll('.comment-item');
    comments.forEach(comment => {comment.remove()});
    
    await loadComments(taskId);
}

async function hideComments(taskId) {
    const taskDiv = document.getElementById('task-list-' + taskId);

    // Удаляем все комментарии и кнопки
    const comments = taskDiv.querySelectorAll('.comment-item');
    comments.forEach(com => com.remove());

    const buttons = taskDiv.querySelectorAll('.sub_btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Очистить список комментариев') || btn.textContent.includes('Закрыть')) {
            btn.remove();
        }
    });
}
