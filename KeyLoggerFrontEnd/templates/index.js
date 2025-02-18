function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function get_logs(){
    let response = await fetch("https://keylogger.shuvax.com/api/get_demo");
    let data = await response.json();
    return data;
}

async function fetchLogs() {
    const table = document.getElementById("Table");
    table.innerHTML = "<tr><td colspan='3' class='text-center'>Loading data...</td></tr>";

    // await sleep(300);

    const data = await get_logs();
    console.log("נתונים מה-API:", data);

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
