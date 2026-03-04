const API_URL_COM = '/api/comments';

async function loadComments(taskId) {
    const res = await fetch(`${API_URL_COM}/${taskId}`);
    const comments = await res.json();
    const listComments = document.getElementById('task-list-' + taskId);

    if (comments.length === 0) {
        listComments.innerHTML = '<p class="no-comments">Пока нет комментариев</p>';
    } else {
        let commentsHtml = '';
        comments.forEach(comment => {
            commentsHtml += `
            <div class="comment-item">
                <p>${comment.title}</p>
                <small>${new Date(comment.createdAt).toLocaleString()}</small>
            </div>
        `;
        });
        listComments.innerHTML = commentsHtml;
    }
}
