const API_URL_COM = '/api/comments';

async function loadComments(taskId) {
    const res = await fetch(`${API_URL_COM}/${taskId}`);
    const comments = await res.json();
    const listComments = document.getElementById('task-list-' + taskId);

    const oldComments = listComments.querySelectorAll('.comment-item, .no-comments-msg, .comment-buttons, .comments-container');
    oldComments.forEach(el => el.remove());

    const existingComments = listComments.querySelectorAll('.comment-item');
    if (existingComments.length > 0) {
        return;
    }

    if (comments.length === 0) {
        const existingMsg = listComments.querySelector('.no-comments-msg');
        if(!existingMsg) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'no-comments-msg';
            msgDiv.textContent = '💬 Нет комментариев';
            msgDiv.style.padding = '10px';
            msgDiv.style.color = '#6b7280';
            msgDiv.style.fontStyle = 'italic';
            listComments.appendChild(msgDiv);

            const subtaskContainer = listComments.querySelector('.subtask-container');
            if (subtaskContainer) {
                subtaskContainer.insertAdjacentElement('afterend', msgDiv);
            } else {
                listComments.appendChild(msgDiv);
            }
            return;
        }
    } else {
        const tempComments = [];

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            commentDiv.innerHTML = `
                <p>${comment.commentText}</p>
                <small>${new Date(comment.createdAt).toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow'
            })} </small>`;
            tempComments.push(commentDiv);
        });

        // ОБЕРТКА ДЛЯ КОММЕНТАРИЕВ
        const commentsWrapper = document.createElement('div');
        commentsWrapper.className = 'comments-container';

        tempComments.forEach(commentDiv => {
            commentsWrapper.appendChild(commentDiv);
        });

        listComments.appendChild(commentsWrapper);

        // КНОПКИ
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'comment-buttons';

        const del = document.createElement('button');
        del.className = 'sub_btn_b';
        del.onclick = () => deleteComment(taskId);
        del.textContent = 'Очистить';

        const back = document.createElement('button');
        back.className = 'sub_btn_b';
        back.onclick = () => hideComments(taskId);
        back.textContent = 'Закрыть';

        buttonContainer.appendChild(del);
        buttonContainer.appendChild(back);
        listComments.appendChild(buttonContainer);
    }
}

async function addComment(taskId) {
    
    const input = document.getElementById(`task-bottom-container-${taskId}`);
    const text = input.value.trim();
    
    await fetch(`${API_URL_COM}/${taskId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({commentText: text})
    });
    
    input.value = '';

    const taskDiv = document.getElementById(`task-list-${taskId}`);
    const noMsg = taskDiv.querySelector('.no-comments-msg');
    if (noMsg) noMsg.remove();

    // Обновляем список комментариев
    await loadComments(taskId);

}

async function deleteComment(taskId) {
    const isConfirmed = confirm("Вы действительно хотите удалить все комментарии?");
    if (!isConfirmed) return;
    
    await fetch(`${API_URL_COM}/${taskId}`, {method: 'DELETE'});

    const taskDiv = document.getElementById(`task-list-${taskId}`);
    
    const task = document.getElementById(`task-list-${taskId}`);
    const comments = task.querySelectorAll('.comment-item');
    comments.forEach(comment => {comment.remove()});

    const buttonContainer = taskDiv.querySelector('.comment-buttons');
    if (buttonContainer) buttonContainer.remove();

    const noMsg = taskDiv.querySelector('.no-comments-msg');
    if (noMsg) noMsg.remove();
    
    await loadComments(taskId);
}

async function hideComments(taskId) {
    const taskDiv = document.getElementById('task-list-' + taskId);

    // Удаляем обертку с комментариями
    const commentsWrapper = taskDiv.querySelector('.comments-container');
    if (commentsWrapper) {
        commentsWrapper.remove();
    }

    // Удаляем контейнер с кнопками
    const buttonContainer = taskDiv.querySelector('.comment-buttons');
    if (buttonContainer) {
        buttonContainer.remove();
    }

    // Удаляем все комментарии и кнопки
    const comments = taskDiv.querySelectorAll('.comment-item');
    comments.forEach(com => com.remove());

    const buttons = taskDiv.querySelectorAll('.sub_btn_b');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Очистить') || btn.textContent.includes('Закрыть')) {
            btn.remove();
        }
    });
}
