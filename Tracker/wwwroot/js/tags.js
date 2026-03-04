const API_URL_TAGS = '/api/tags';

async function loadTags() {
    const res = await fetch(API_URL_TAGS);
    const tags = await res.json();
    const tagList = document.getElementById('tags-container');
    tagList.innerHTML = '';
    
    tags.forEach( tag => {
        const div = document.createElement('div');
        div.className = 'tag';
        div.innerHTML = `
        <span class="tag-text" id="tags-${tag.id}">${tag.name}</span>
        <button onclick="deleteTag(${tag.id})">🗑</button>
        `
        tagList.appendChild(div);
    })
}

async function CreatedTag() {
    const tagInput = document.getElementById('tagInput');
    const tag = tagInput.value.trim();
    await fetch(API_URL_TAGS, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: tag})
    })
    tagInput.value = '';
    await loadTags();
}

async function deleteTag(tagId) {
    await fetch(`${API_URL_TAGS}/${tagId}`, {method: 'DELETE'});
    await loadTags();
}