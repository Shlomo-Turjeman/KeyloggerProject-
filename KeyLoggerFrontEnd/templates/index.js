function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function fetchLogs() {
    const t = document.getElementById("Table");
    t.innerHTML = "<tr><td colspan='3' class='text-center'>loading data...</td></tr>";
    await sleep(300);
    

    
    const data = [
        {time: "1233", window: "a", text: "fvfvf"},
        {time:"4569",window:"b",text:"gbjfnds"},{time: "1233", window: "a", text: "fvfvf"},
        {time:"4569",window:"b",text:"gbjfnds"},{time: "1233", window: "a", text: "fvfvf"},
        {time:"4569",window:"b",text:"gbjfnds"}
    ]
    function add_rows(data_a){
        const t = document.getElementById("Table");
        t.innerHTML = ""
        if (data_a.length === 0){
            t.innerHTML = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
        }else{
            data_a.forEach(row => {
                const r = document.createElement("tr");
                r.innerHTML = `<td>${row.time}</td><td>${row.window}</td><td>${row.text}</td>`;
                t.appendChild(r);
            });  
        }
        

    }

add_rows(data)
}


document.addEventListener("DOMContentLoaded", fetchLogs);
