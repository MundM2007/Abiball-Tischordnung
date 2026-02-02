const addTableButton = document.getElementById('add_table_button');
const exportButton = document.getElementById('export_button');
const importButton = document.getElementById('import_button');
const importFileInput = document.getElementById('import_file');
let tableCount = 0;
let tableNextId = 0;

addTableButton.addEventListener('click', createTable);
exportButton.addEventListener('click', downloadLayoutFile);
importButton.addEventListener('click', importLayout);

function tableEndLeft(){
    // create left end of table image
    let tableEnd = document.createElement("img");
    tableEnd.setAttribute("class", "table_end_left table_segment");
    tableEnd.setAttribute("src", "./icons/table_grey_end_left.svg");
    return tableEnd;
}


function tableEndRight(){
    // create right end of table image
    let tableEnd = document.createElement("img");
    tableEnd.setAttribute("class", "table_end_right table_segment");
    tableEnd.setAttribute("src", "./icons/table_grey_end_right.svg");
    return tableEnd;
}


function tableMiddle(){  
    // create middle segment of table image
    let tableMiddle = document.createElement("img");
    tableMiddle.setAttribute("class", "table_middle table_segment");
    tableMiddle.setAttribute("src", "./icons/table_grey_middle.svg");
    return tableMiddle;
}


function createTable(_e) {
    // Prompt user for table length
    let length = window.prompt("Geben Sie die Länge des Tisches an:", "3");
    if (length === null) return; // User cancelled the prompt
    length = Number(length)
    if (!Number.isInteger(length) || length < 2) {
        alert("Bitte geben Sie eine gültige Zahl (>=2) ein."); 
        return;
    }

    // add table
    addTable(tableNextId, length);
    addTableInteractionButton(tableNextId);
    tableCount++;
    tableNextId++;
}


function addTable(id, length, posLeft = "100px", posTop = "200px", rotation = ""){
    // create table elements
    let table = document.createElement("div");
    table.setAttribute("id", "table-" + id);
    table.setAttribute("class", "table");
    document.getElementById("tables_container").appendChild(table);

    // internal table wrapper
    let tableWrapper = document.createElement("div");
    tableWrapper.setAttribute("id", "table_wrapper-" + id);
    tableWrapper.setAttribute("class", "table_wrapper");
    table.appendChild(tableWrapper);

    tableWrapper.appendChild(tableEndLeft());
    for (let i = 0; i < length - 2; i++) {
        tableWrapper.appendChild(tableMiddle());
    }
    tableWrapper.appendChild(tableEndRight());

    table.style.left = posLeft;
    table.style.top = posTop;
    tableWrapper.style.transform = rotation;
}


function addTableInteractionButton(id){
    // add button
    let table = document.getElementById("table-" + id);
    let button = document.createElement("button");
    button.setAttribute("id", "table_interaction_button-" + id);
    button.setAttribute("class", "table_interaction_button small_table_interaction_button hide_on_action");
    table.appendChild(button);

    // handle click
    button.dataset.clicked = "false";
    button.addEventListener('click', handleTableInteraction);
}


function handleTableInteraction(_e){
    toggleTableInteractionState(document.getElementById(this.id));
}


function toggleTableInteractionState(button){
    if(button.dataset.clicked === "false"){
        // enable action buttons -> set interaction button to clicked
        button.dataset.clicked = "true";
        button.style.backgroundImage = "url('./icons/cross_grey_circle.svg')";

        // disable other interaction button
        if(document.getElementById("rotate_button") !== null){
            toggleTableInteractionState(
                document.getElementById("table_interaction_button-" + document.getElementById("rotate_button").parentElement.id.split("-")[1])
            );
        }
        createActionButtonsForTable(button);
    }else{
        // disable action buttons -> reset interaction button
        button.dataset.clicked = "false";
        button.style.backgroundImage = "";
        removeActionButtons();
    }
}


function createActionButtonsForTable(button){
    // create and set Attributes for action buttons
    let rotateButton = document.createElement("button");
    let moveButton = document.createElement("button");
    let deleteButton = document.createElement("button");

    rotateButton.setAttribute("id", "rotate_button");
    moveButton.setAttribute("id", "move_button");
    deleteButton.setAttribute("id", "delete_button");

    rotateButton.setAttribute("class", "table_interaction_button");
    moveButton.setAttribute("class", "table_interaction_button");
    deleteButton.setAttribute("class", "table_interaction_button");

    // add buttons, figure out table
    let table = button.parentElement;
    table.appendChild(rotateButton);
    table.appendChild(moveButton);
    table.appendChild(deleteButton);

    // positions and background images are handled via CSS

    // add event listeners for buttons
    rotateButton.addEventListener('click', rotateTableButtonClick);
    moveButton.addEventListener('click', moveTableButtonClick);
    deleteButton.addEventListener('click', deleteTableButtonClick);
}


function hideAllActionButtons(){
    let actionButtons = document.querySelectorAll(".hide_on_action");
    for(let i = 0; i < actionButtons.length; i++){
        actionButtons[i].style.display = "none";
    }
}


function showAllActionButtons(){
    let actionButtons = document.querySelectorAll(".hide_on_action");
    for(let i = 0; i < actionButtons.length; i++){
        actionButtons[i].style.display = "inline-block";
    }
}


function rotateTableButtonClick(e){
    // get table, middle position, original rotation
    let table = document.getElementById(this.id).parentElement;
    let tableWrapper = table.firstChild;
    let middleOfTableX = table.offsetLeft + table.offsetWidth / 2;
    let middleOfTableY = table.offsetTop + table.offsetHeight / 2;
    let originalRotation = tableWrapper.style.transform;

    // initial rotation to cursor position
    rotateTable(e, tableWrapper, middleOfTableX, middleOfTableY);

    // toggle interaction button, hide all buttons
    let tableInteractionButton = document.getElementById("table_interaction_button-" + table.id.split("-")[1]);
    toggleTableInteractionState(tableInteractionButton);
    hideAllActionButtons();

    function rotateTableHandler(e){
        rotateTable(e, tableWrapper, middleOfTableX, middleOfTableY);
    }

    // cancel rotation on escape key
    function cancelRotation(e){
        if(e.key === 'Escape'){
            document.removeEventListener('mousemove', rotateTableHandler);
            document.removeEventListener('click', finishRotation, {capture: true, once: true});
            tableWrapper.style.transform = originalRotation;
            showAllActionButtons();
        }
    }

    // finish rotation on click
    function finishRotation(e){
        e.stopImmediatePropagation();
        document.removeEventListener('mousemove', rotateTableHandler);
        document.removeEventListener('keydown', cancelRotation);
        showAllActionButtons();
    }
    
    // add event listeners
    document.addEventListener('mousemove', rotateTableHandler);
    document.addEventListener('keydown', cancelRotation, {once: true});
    setTimeout(() => document.addEventListener('click', finishRotation, {capture: true, once: true}), 0); // timeout to avoid immediate trigger
}


// rotate table based on cursor position relative to middle of table
function rotateTable(e, tableWrapper, middleOfTableX, middleOfTableY){
    let angle = Math.atan2(e.pageY - middleOfTableY, e.pageX - middleOfTableX);
    let angleDeg = Math.round(angle * 16 / Math.PI) * 11.25; // round to nearest 11.25 degrees
    tableWrapper.style.transform = `rotate(${angleDeg}deg)`;
}


function moveTableButtonClick(e){
    // get table, original position
    let table = document.getElementById(this.id).parentElement;
    let originalPositionX = table.style.left;
    let originalPositionY = table.style.top;

    // initial move to cursor position
    moveTable(e, table);

    // toggle interaction button, hide all buttons
    let tableInteractionButton = document.getElementById("table_interaction_button-" + table.id.split("-")[1]);
    toggleTableInteractionState(tableInteractionButton);
    hideAllActionButtons();

    function moveTableHandler(e){
        moveTable(e, table);
    }

    // cancel move on escape key
    function cancelMove(e){
        if(e.key === 'Escape'){
            document.removeEventListener('mousemove', moveTableHandler);
            document.removeEventListener('click', finishMove, {capture: true, once: true});
            table.style.left = originalPositionX;
            table.style.top = originalPositionY;
            showAllActionButtons();
        }
    }

    // finish move on click
    function finishMove(e){
        e.stopImmediatePropagation();
        document.removeEventListener('mousemove', moveTableHandler);
        document.removeEventListener('keydown', cancelMove);
        showAllActionButtons();
    }

    // add event listeners
    document.addEventListener('mousemove', moveTableHandler);
    document.addEventListener('keydown', cancelMove, {once: true});
    setTimeout(() => document.addEventListener('click', finishMove, {capture: true, once: true}), 0);
}


// move table's center to cursor position
function moveTable(e, table){
    table.style.left = e.pageX - (table.offsetWidth / 2) + 'px';
    table.style.top = e.pageY - (table.offsetHeight / 2) + 'px';
}


// delete table after confirmation
function deleteTableButtonClick(_e){
    if(window.confirm("Sind Sie sicher, dass Sie diesen Tisch löschen möchten?")){
        let table = document.getElementById(this.id).parentElement;
        table.remove();
        tableCount--;
    }
}


// remove action buttons
function removeActionButtons(){
    if(document.getElementById("rotate_button")) document.getElementById("rotate_button").remove();
    if(document.getElementById("move_button")) document.getElementById("move_button").remove();
    if(document.getElementById("delete_button")) document.getElementById("delete_button").remove();
}


function verifyJSON(json){
    if(!json || !Array.isArray(json.tables) || !json.hasOwnProperty('tableCount') || !json.hasOwnProperty('tableNextId')){
        alert("Ungültige Layout-Daten.");
        return false;
    }
    for(let i = 0; i < json.tables.length; i++){
        let table = json.tables[i];
        if(!table.hasOwnProperty('id') ||  !table.hasOwnProperty('length')){
            alert("Ungültige Layout-Daten.");
            return false;
        }
    }
    return true;
}


async function importLayout(_e){
    // confirm replacement, and remove existing tables
    if(window.confirm("Das aktuelle Layout wird durch das importierte Layout ersetzt. Möchten Sie fortfahren?")){
        for(let i = 0; i < tableNextId; i++){
            let element = document.getElementById("table-" + i);
            if (element) element.remove();
        }
        
        // read and verify layout data
        let json = await readLayoutFile();
        if(!json) return;
        if(!verifyJSON(json)) return;

        // recreate layout, set counters
        tableCount = json.tableCount;
        tableNextId = json.tableNextId;
        for(let i = 0; i < json.tables.length; i++){
            let table = json.tables[i];
            addTable(
                table.id, 
                table.length, 
                table.position?.left ?? "100px",
                table.position?.top ?? "200px", 
                table.rotation ?? "");
            addTableInteractionButton(table.id);
        }
    }
} 


async function readLayoutFile(){
    // get first file uploaded, end if none are
    const file = importFileInput.files[0];
    if(!file){
        alert("Bitte wählen Sie eine Datei zum Importieren aus.");
        return null;
    }

    // read the file and parse JSON
    try {
        const text = await file.text();
        return JSON.parse(text);
    } catch (error) {
        if (error instanceof SyntaxError) {
            alert("Ungültiges JSON: " + error.message);
        } else {
            alert("Fehler beim Lesen der Datei: " + error.message);
        }
        return null;
    }
}


function exportLayout(){
    // export data as JSON file, first add general information
    let layoutData = {
        tables: [],
        tableCount: tableCount,
        tableNextId: tableNextId
    };
    // then add each table's data
    for(let i = 0; i < tableNextId; i++){
        let table = document.getElementById("table-" + i);
        if(table){
            layoutData.tables.push({
                id: i,
                position: {
                    left: table.style.left,
                    top: table.style.top
                },
                rotation: table.firstChild.style.transform,
                length: table.firstChild.children.length
            });
        }
    }
    return layoutData;
}


function downloadLayoutFile(_e) {
    let file = new File([JSON.stringify(exportLayout())], "Tisch-Layout.json")

    // Create a link and set the URL using `createObjectURL`
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(file);
    link.download = file.name;

    // It needs to be added to the DOM so it can be clicked
    document.body.appendChild(link);
    link.click();

    // To make this work on Firefox we need to wait
    // a little while before removing it.
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.parentNode.removeChild(link);
    }, 0);
}