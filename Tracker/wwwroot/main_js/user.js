API_USER = "/api/auth";
function openRegistrModal(){
    document.querySelectorAll(".auth-container").display="none";
    document.getElementById("registerModal").style.display="flex";
}

function closeRegistrModal(){
    document.getElementById("registerModal").style.display="none";
}

async function register(){
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const password_confirmation = document.getElementById("regConfirmPassword").value.trim();

    document.querySelectorAll('.input-group').forEach(g => g.classList.remove('error'));
    document.querySelectorAll('.error-icon').forEach(i => i.style.display = 'none');

    let hasError = false;

    // Проверка логина
    if (!username) {
        document.getElementById('regUsernameGroup').classList.add('error');
        document.getElementById('regUsernameIcon').style.display = 'inline';
        hasError = true;
    }

    // Проверка email
    if (!email) {
        document.getElementById('regEmailGroup').classList.add('error');
        document.getElementById('regEmailIcon').style.display = 'inline';
        hasError = true;
    }

    // Проверка пароля
    if (!password) {
        document.getElementById('regPasswordGroup').classList.add('error');
        document.getElementById('regPasswordIcon').style.display = 'inline';
        hasError = true;
    } else if (password.length < 6) {
        document.getElementById('regPasswordGroup').classList.add('error');
        document.getElementById('regPasswordIcon').style.display = 'inline';
        alert('Пароль должен быть не менее 6 символов');
        hasError = true;
    }

    // Проверка подтверждения
    if (!password_confirmation) {
        document.getElementById('regConfirmPasswordGroup').classList.add('error');
        document.getElementById('regConfirmIcon').style.display = 'inline';
        hasError = true;
    } else if (password !== password_confirmation) {
        document.getElementById('regConfirmPasswordGroup').classList.add('error');
        document.getElementById('regConfirmIcon').style.display = 'inline';
        alert('Пароли не совпадают');
        hasError = true;
    }

    if (hasError) return;
    try {
        const res = await fetch(`${API_USER}/register`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username, "email": email, "password": password}, )
        })
        
        if(res.ok){
            alert("Регистрация пользователя прошла успешна, теперь войдите в аккаунт!");
            closeRegistrModal();
            document.getElementById("regConfirmPassword").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("regEmail").value = "";
            document.getElementById("regUsername").value = "";
        }else if(res.status === 400){
            alert("Такой пользователь уже существует");  //придумать что делать дальше 
            // (очищать поля ? предлагать восстановить профиль ?)                                                                                                                                                                                                                                                       
        }
    } catch (err){
        alert("Ошибка соединения с сервером");
    }
}
document.getElementById('regUsername').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        this.closest('.input-group').classList.remove('error');
        this.parentElement.querySelector('.bi-exclamation-circle').style.display = 'none';
    }
});
document.getElementById('regEmail').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        this.closest('.input-group').classList.remove('error');
        this.parentElement.querySelector('.bi-exclamation-circle').style.display = 'none';
    }
});
document.getElementById('regPassword').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        this.closest('.input-group').classList.remove('error');
        this.parentElement.querySelector('.bi-exclamation-circle').style.display = 'none';
    }
});
document.getElementById('regConfirmPassword').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        this.closest('.input-group').classList.remove('error');
        this.parentElement.querySelector('.bi-exclamation-circle').style.display = 'none';
    }
});

async function login_user(){
    const username = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;
    //const email = document.getElementById("adminEmail").value;

    const res = await fetch(`${API_AUTH}/login`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password }),
        credentials: 'include' //отправляет и принимает токен
    });

    if(res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        window.location.href = "user.html";
    } else{
        alert("Неверный логин или пароль");
    }
}