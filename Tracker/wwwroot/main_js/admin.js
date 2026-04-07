const API_AUTH = "/api/auth";
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const role = btn.dataset.role; 
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        })
        btn.classList.add('active');
        if (role === 'admin') {
            document.getElementById("adminForm").classList.remove('hidden');
            document.getElementById("userForm").classList.add('hidden');
        } else {
            document.getElementById("adminForm").classList.add('hidden');
            document.getElementById("userForm").classList.remove('hidden');
        }
    });
});

async function login_adm() {
    const username = document.getElementById("adminLogin").value;
    const password = document.getElementById("adminPassword").value;
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