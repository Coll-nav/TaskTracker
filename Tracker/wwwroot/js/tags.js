const API_URL_TAGS = '/api/tags';

let tagsInitialized = false;
let restoreInProgress = false;
let saveTimeout = null;

// Загружаем теги из БД
async function loadTags() {
    try {
        const res = await fetch(API_URL_TAGS);
        const tags = await res.json();

        const container = document.getElementById('tags-container');
        container.innerHTML = '';

        tags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag';
            div.setAttribute('draggable', 'true');
            div.dataset.tagId = tag.id;
            div.innerHTML = `
            <span>${tag.name}</span>
            <button onclick="deleteTag(${tag.id})">🗑️</button>`;
            container.appendChild(div);
        });

        setupDragAndDrop();

        // Восстанавливаем теги после загрузки
        setTimeout(() => {
            if (!tagsInitialized) {
                restoreTaskTags();
            }
        }, 200);

    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function restoreTaskTags() {
    // Предотвращаем множественные вызовы
    if (restoreInProgress) return;
    restoreInProgress = true;

    console.log('Восстанавливаем теги...');

    const savedTags = localStorage.getItem('taskTags');
    if (!savedTags) {
        tagsInitialized = true;
        restoreInProgress = false;
        return;
    }

    try {
        const taskTags = JSON.parse(savedTags);

        // Проверяем, загрузились ли задачи
        const tasks = document.querySelectorAll('.task');
        if (tasks.length === 0) {
            console.log('Задачи ещё не загружены, пробуем позже...');
            restoreInProgress = false;
            setTimeout(restoreTaskTags, 300);
            return;
        }

        // Сначала показываем все оригинальные теги
        document.querySelectorAll('.tag').forEach(tag => {
            tag.style.display = 'inline-block';
        });

        // Удаляем все существующие теги в задачах
        document.querySelectorAll('.task-tag').forEach(el => el.remove());

        // Восстанавливаем теги для каждой задачи
        let restoredCount = 0;

        Object.keys(taskTags).forEach(taskId => {
            const taskDiv = document.getElementById(`task-list-${taskId}`);
            if (!taskDiv) return;

            let tagsContainer = taskDiv.querySelector('.task-tags-container');
            if (!tagsContainer) {
                tagsContainer = document.createElement('div');
                tagsContainer.className = 'task-tags-container';
                taskDiv.insertBefore(tagsContainer, taskDiv.firstChild);
            }

            taskTags[taskId].forEach(tagData => {
                if (!tagData || !tagData.id) return;

                const tagSpan = createTagElement(tagData, taskId);
                tagsContainer.appendChild(tagSpan);

                // Прячем оригинальный тег
                const originalTag = document.querySelector(`.tag[data-tag-id="${tagData.id}"]`);
                if (originalTag) originalTag.style.display = 'none';

                restoredCount++;
            });
        });

        tagsInitialized = true;
        restoreInProgress = false;
        console.log(`Восстановлено тегов: ${restoredCount}`);

    } catch (e) {
        console.error('Ошибка восстановления:', e);
        tagsInitialized = true;
        restoreInProgress = false;
    }
}

function saveTaskTags() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    // Сохраняем с задержкой, чтобы избежать множественных сохранений
    saveTimeout = setTimeout(() => {
        if (!tagsInitialized) {
            console.log('Теги не инициализированы, сохраняем позже');
            saveTimeout = setTimeout(() => saveTaskTags(), 200);
            return;
        }

        const taskTags = {};
        let hasTags = false;

        document.querySelectorAll('.task').forEach(task => {
            const taskId = task.id.replace('task-list-', '');
            const tags = [];

            const tagsContainer = task.querySelector('.task-tags-container');
            if (tagsContainer) {
                tagsContainer.querySelectorAll('.task-tag').forEach(tagSpan => {
                    const tagText = tagSpan.cloneNode(true);
                    const removeBtn = tagText.querySelector('span');
                    if (removeBtn) removeBtn.remove();

                    tags.push({
                        id: tagSpan.dataset.tagId,
                        name: tagText.textContent.trim()
                    });
                });
            }

            if (tags.length > 0) {
                taskTags[taskId] = tags;
                hasTags = true;
            }
        });

        if (hasTags) {
            localStorage.setItem('taskTags', JSON.stringify(taskTags));
            console.log('Теги сохранены:', taskTags);
        } else {
            // Если нет тегов, удаляем из localStorage
            localStorage.removeItem('taskTags');
            console.log('Теги удалены из хранилища');
        }

        saveTimeout = null;
    }, 100); // Задержка 100мс
}

function createTagElement(tagData, taskId) {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'task-tag';
    tagSpan.dataset.tagId = tagData.id;
    tagSpan.dataset.taskId = taskId;
    tagSpan.textContent = tagData.name;

    const removeBtn = document.createElement('span');
    removeBtn.textContent = ' ×';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.marginLeft = '5px';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeTagFromTask(taskId, tagData.id, tagSpan);
    };

    tagSpan.appendChild(removeBtn);
    return tagSpan;
}

// Настройка Drag & Drop
function setupDragAndDrop() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('dragstart', dragStart);
        tag.addEventListener('dragend', dragEnd);
    });

    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('dragover', dragOver);
        task.addEventListener('dragleave', dragLeave);
        task.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    const tag = e.target.closest('.tag');
    if (!tag) return;

    e.dataTransfer.setData('text/plain', tag.dataset.tagId);
    e.dataTransfer.setData('text/plain-name', tag.querySelector('span').textContent);
    tag.style.opacity = '0.5';
}

function dragEnd(e) {
    const tag = e.target.closest('.tag');
    if (tag) tag.style.opacity = '1';
}

function dragOver(e) {
    e.preventDefault();
    e.currentTarget.style.border = '2px solid #4CAF50';
}

function dragLeave(e) {
    e.currentTarget.style.border = '';
}

function drop(e) {
    e.preventDefault();
    const task = e.currentTarget;
    task.style.border = '';

    const tagId = e.dataTransfer.getData('text/plain');
    const tagName = e.dataTransfer.getData('text/plain-name');
    const taskId = task.id.replace('task-list-', '');

    if (!tagId || !taskId) return;

    //создаем контейнер для тегов
    let tagsContainer = task.querySelector('.task-tags-container');
    if (!tagsContainer) {
        tagsContainer = document.createElement('div');
        tagsContainer.className = 'task-tags-container';
        task.insertBefore(tagsContainer, task.firstChild);
    }
    
    if (tagsContainer.querySelector(`.task-tag[data-tag-id="${tagId}"]`)) {
        alert('Этот тег уже прикреплен');
        return;
    }

    // Создаем тег
    const tagData = { id: tagId, name: tagName };
    const tagSpan = createTagElement(tagData, taskId);
    tagsContainer.appendChild(tagSpan);

    // Прячем оригинал
    const originalTag = document.querySelector(`.tag[data-tag-id="${tagId}"]`);
    if (originalTag) originalTag.style.display = 'none';

    saveTaskTags();
}

function removeTagFromTask(taskId, tagId, tagElement) {
    tagElement.remove();

    const originalTag = document.querySelector(`.tag[data-tag-id="${tagId}"]`);
    if (originalTag) originalTag.style.display = 'inline-block';

    saveTaskTags();
}

async function CreatedTag() {
    const input = document.getElementById('tagInput');
    const text = input.value.trim();
    if (!text) return;

    if (text.length > 35) {
        alert('Длина тега не должна превышать 35 символов');
        input.value = '';
        return;
    }

    try {
        const resCheck = await fetch('/api/tags');
        const existingTags = await resCheck.json();

        const tagExists = existingTags.some(tag => tag.name.toLowerCase() === text.toLowerCase());

        if (tagExists) {
            alert('Тег с таким названием уже существует!');
            input.value = '';
            return;
        }
        
        const res = await fetch('/api/tags', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: text})
        });

        if (res.ok) {
            input.value = '';
            await loadTags();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function deleteTag(tagId) {
    if (!confirm('Удалить тег из системы?')) return;

    try {
        await fetch(`/api/tags/${tagId}`, {method: 'DELETE'});

        // Удаляем тег из всех задач на странице
        document.querySelectorAll(`.task-tag[data-tag-id="${tagId}"]`).forEach(el => {
            const taskId = el.dataset.taskId;
            el.remove();

            // Показываем оригинальный тег
            const originalTag = document.querySelector(`.tag[data-tag-id="${tagId}"]`);
            if (originalTag) originalTag.style.display = 'inline-block';
        });

        const savedTags = localStorage.getItem('taskTags');
        if (savedTags) {
            const taskTags = JSON.parse(savedTags);
            let changed = false;

            Object.keys(taskTags).forEach(taskId => {
                const originalLength = taskTags[taskId].length;
                taskTags[taskId] = taskTags[taskId].filter(tag => tag.id != tagId);
                if (taskTags[taskId].length !== originalLength) {
                    changed = true;
                }
                if (taskTags[taskId].length === 0) {
                    delete taskTags[taskId];
                }
            });

            if (changed) {
                if (Object.keys(taskTags).length > 0) {
                    localStorage.setItem('taskTags', JSON.stringify(taskTags));
                } else {
                    localStorage.removeItem('taskTags');
                }
            }
        }

        await loadTags();

    } catch (error) {
        console.error('Ошибка:', error);
    }
}


const originalAddTask = window.addTask;
if (originalAddTask) {
    window.addTask = async function() {
        await originalAddTask();
        setTimeout(() => {
            restoreTaskTags();
        }, 150);
    };
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
                if (node.classList && node.classList.contains('task')) {
                    // На новую задачу добавляем обработчики DnD
                    node.addEventListener('dragover', dragOver);
                    node.addEventListener('dragleave', dragLeave);
                    node.addEventListener('drop', drop);

                    // Пробуем восстановить теги
                    if (!tagsInitialized) {
                        setTimeout(restoreTaskTags, 100);
                    }
                }
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Начинаем наблюдение за изменениями в списке задач
    const taskList = document.getElementById('taskList');
    if (taskList) {
        observer.observe(taskList, { childList: true, subtree: true });
    }

    loadTags();
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!tagsInitialized) {
            restoreTaskTags();
        }
    }, 500);
});