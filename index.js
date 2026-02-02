const addTableButton = document.getElementById('add_table_button');
let tableCount = 0;
let tableNextId = 0;

addTableButton.addEventListener('click', spawnTable);

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


function spawnTable(_e) {
    // Prompt user for table length
    let lengthOfTable = window.prompt("Geben Sie die Länge des Tisches an:", "3");
    if (lengthOfTable === null) return; // User cancelled the prompt
    if (isNaN(lengthOfTable) || parseInt(lengthOfTable) < 2) {alert("Bitte geben Sie eine gültige Zahl (>=2) ein."); return;}
    lengthOfTable = parseInt(lengthOfTable);

    // create table elements
    let table = document.createElement("div");
    table.setAttribute("id", "table-" + tableNextId);
    table.setAttribute("class", "table");
    document.getElementById("tables_container").appendChild(table);

    // internal table wrapper
    let tableWrapper = document.createElement("div");
    tableWrapper.setAttribute("id", "table_wrapper-" + tableNextId);
    tableWrapper.setAttribute("class", "table_wrapper");
    table.appendChild(tableWrapper);

    tableWrapper.appendChild(tableEndLeft());
    for (let i = 0; i < lengthOfTable - 2; i++) {
        tableWrapper.appendChild(tableMiddle());
    }
    tableWrapper.appendChild(tableEndRight(true));

    // add table
    spawnTableButton(table);
    tableCount++;
    tableNextId++;
}


function spawnTableButton(table){
    // add button
    let button = document.createElement("button");
    button.setAttribute("id", "table_interaction_button-" + tableNextId);
    button.setAttribute("class", "table_interaction_button small_table_interaction_button hide_on_action");
    table.appendChild(button);

    // set position, handle click
    button.style.left = table.offsetWidth / 2 - 13 + "px";
    button.style.top = "37px";
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
        if(document.getElementById("rotate_button")) {
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

    // set positions and background images
    rotateButton.style.left = table.offsetWidth / 2 - 70 + "px";
    rotateButton.style.top = "-10px";
    rotateButton.style.backgroundImage = "url('./icons/rotate_black_circle.svg')";

    moveButton.style.left = table.offsetWidth / 2 - 20 + "px";
    moveButton.style.top = "-30px";
    moveButton.style.backgroundImage = "url('./icons/move_black_circle.svg')";

    deleteButton.style.left = table.offsetWidth / 2 + 30 + "px";
    deleteButton.style.top = "-10px";
    deleteButton.style.backgroundImage = "url('./icons/cross_red_circle.svg')";

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
    document.getElementById("rotate_button").remove();
    document.getElementById("move_button").remove();
    document.getElementById("delete_button").remove();
}