document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://127.0.0.1:9734/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    document.getElementById("message").innerHTML = result.msg;
    console.log("Cookies after login:", document.cookie);

    if (response.ok) {
        window.location.href = "index.html";
    }
});