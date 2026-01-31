const addTableButton = document.getElementById('add_table_button');
let tableCount = 0;

addTableButton.addEventListener('click', spawnTable);

function tableEndLeft(){
    let tableEnd = document.createElement("img");
    tableEnd.setAttribute("class", "table_end_left table_segment");
    tableEnd.setAttribute("src", "./icons/table_grey_end_left.svg");
    return tableEnd;
}

function tableEndRight(){
    let tableEnd = document.createElement("img");
    tableEnd.setAttribute("class", "table_end_right table_segment");
    tableEnd.setAttribute("src", "./icons/table_grey_end_right.svg");
    return tableEnd;
}

function tableMiddle(){  
    let tableMiddle = document.createElement("img");
    tableMiddle.setAttribute("class", "table_middle table_segment");
    tableMiddle.setAttribute("src", "./icons/table_grey_middle.svg");
    return tableMiddle;
}  

function spawnTable(e) {
    let lengthOfTable = window.prompt("Geben Sie die Länge des Tisches an:", "3");
    if (lengthOfTable === null) return; // User cancelled the prompt
    if (isNaN(lengthOfTable) || parseInt(lengthOfTable) < 2) {alert("Bitte geben Sie eine gültige Zahl (>=2) ein."); return;}
    lengthOfTable = parseInt(lengthOfTable);
    let tableWrapper = document.createElement("div");
    tableWrapper.setAttribute("id", "table" + tableCount);
    tableWrapper.setAttribute("class", "table");
    tableWrapper.appendChild(tableEndLeft());
    for (let i = 0; i < lengthOfTable - 2; i++) {
        tableWrapper.appendChild(tableMiddle());
    }
    tableWrapper.appendChild(tableEndRight(true));
    tableCount++;
    document.getElementById("tables_container").appendChild(tableWrapper);
}

/*

function toggleMovement(e) {
    if(moveableButton.dataset.moving === "false"){
        moveableButton.dataset.moving = "true";
        moveableButton.style.left = e.clientX - 50 + 'px';
        moveableButton.style.top = e.clientY - 50 + 'px';
        document.addEventListener('mousemove', moveElement);
    }else{
        moveableButton.dataset.moving = "false";
        document.removeEventListener('mousemove', moveElement);
    }
}

function moveElement(e) {
    moveableButton.style.left = e.clientX - 50 + 'px';
    moveableButton.style.top = e.clientY - 50 + 'px';
}

*/