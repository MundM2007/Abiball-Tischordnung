const tableSegmentHeight = 100;
const tableMiddleSegmentWidth = tableSegmentHeight * 70 / 230 // aspect ratio of table middle segment image;

// always open elements
const addTableButton = document.getElementById('add_table_button');
const exportSeatingButton = document.getElementById('export_seating_button');
const importGuestsButton = document.getElementById('import_guests_button');
const importGuestsFileInput = document.getElementById('import_guests_file');
const exportButton = document.getElementById('export_button');
const importButton = document.getElementById('import_button');
const importFileInput = document.getElementById('import_file');
const addGroupButton = document.getElementById('add_group_button');
const addPersonButton = document.getElementById('add_person_button');
const searchInput = document.getElementById('search_input');
// track amount of tables and next table id
let tableCount = 0;
let tableNextId = 0;
// track current open action button and type
let openInteractionButton = "";
let openInteractionButtonType = "";
// guest list
let guests = [];
let guestMode = "default"; // default, select_group, select_person, select_position_group, select_position_person
let selectedGuestNumber = null;
// temporary variable to store seat ids, unassigned guests count from a group
let originalSeatAllocation = [];
let unassignedGuestsFromGroupCount = 0;

// add event listeners
addTableButton.addEventListener('click', createTable);
exportSeatingButton.addEventListener('click', downloadSeatingFile);
exportButton.addEventListener('click', downloadLayoutFile);
importGuestsButton.addEventListener('click', importGuests);
importButton.addEventListener('click', importLayout);
addGroupButton.addEventListener('click', startGroupPlacement);
addPersonButton.addEventListener('click', startPersonPlacement);
searchInput.addEventListener("input", searchGuestList);


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
    length = Number(length);
    if (!Number.isInteger(length) || length < 2 || length > 100) {
        alert("Bitte geben Sie eine gültige Zahl (>=2, <=100) ein."); 
        return;
    }

    // add table, update counters
    addTable(tableNextId, length);
    addTableInteractionButton(tableNextId);
    addTableNumberInformation(tableNextId);
    addSeatInteractionButtons(tableNextId);
    tableCount++;
    tableNextId++;
    updateTableNumbers(); // needs to be done after increasing tableNextId, because it loops over it
}


function addTable(id, length, posLeft = "100px", posTop = "200px", rotation = "rotate(0deg)") {
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

    // add table segment wrapper, to hold all images, needed because seat button wrappers will also be children of table wrapper
    let tableSegmentWrapper = document.createElement("div");
    tableSegmentWrapper.setAttribute("id", "table_segment_wrapper-" + id)
    tableSegmentWrapper.setAttribute("class", "table_segment_wrapper");
    tableWrapper.appendChild(tableSegmentWrapper)

    // add table segments
    tableSegmentWrapper.appendChild(tableEndLeft());
    for(let i = 0; i < length - 2; i++) {
        tableSegmentWrapper.appendChild(tableMiddle());
    }
    tableSegmentWrapper.appendChild(tableEndRight());

    // set position and rotation
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
    button.addEventListener('click', handleTableInteraction);
}


function addTableNumberInformation(id, number="null"){
    // create table number information element
    let tableNumberInformation = document.createElement("p");
    tableNumberInformation.setAttribute("id", "table_number_information-" + id);
    tableNumberInformation.setAttribute("class", "table_number_information hide_on_action");

    // add to table
    let table = document.getElementById("table-" + id);
    table.appendChild(tableNumberInformation);
    table.dataset.number = number;
}


function addSeatInteractionButtons(id, rotation = "rotate(0deg)"){
    // add interaction buttons for each seat
    let table = document.getElementById("table-" + id);
    let length = table.firstChild.firstChild.children.length;
    for(let i = 0; i < length; i++){
        for(let j = 0; j < 2; j++){
            // add wrapper, to set position and undo rotation donne by the table wrapper for the interaction menu
            let div = document.createElement("div");
            div.setAttribute("id", "seat_interaction_button_wrapper-" + id + "." + (i*2+j));
            div.setAttribute("class", "seat_interaction_button_wrapper hide_on_action");
            table.firstChild.appendChild(div);
            div.style.transform = 
                `translateX(${Math.round(tableMiddleSegmentWidth*(i-((length-1)/2)))-7}px) ` + 
                `translateY(${j*80-47}px) ` + 
                "rotate(" + String(-Number(rotation.replace("rotate(", "").replace("deg)", ""))) + "deg)";

            // add button, set dataset.guest to null for later use
            let button = document.createElement("button");
            button.setAttribute("id", "seat_interaction_button-" + id + "."+ (i*2+j));
            button.setAttribute("class", "seat_interaction_button small_seat_interaction_button");
            div.appendChild(button);
            button.dataset.guest = null;
            button.dataset.floodFilled = "false";

            // show seat number information
            let seatNumberInformation = document.createElement("p");
            seatNumberInformation.setAttribute("id", "seat_number_information-" + id + "." + (i*2+j));
            seatNumberInformation.setAttribute("class", "seat_number_information hide_on_action");
            div.appendChild(seatNumberInformation);
            seatNumberInformation.innerText = "S" + (i*2+j+1);

            // add event listeners
            button.addEventListener('click', handleSeatInteraction);
            button.addEventListener('mouseover', toggleHighlight);
            button.addEventListener('mouseout', toggleHighlight);
        }
    }
}


function handleTableInteraction(_e){
    toggleTableInteractionState(document.getElementById(this.id), "table", true);
}


function handleSeatInteraction(_e){
    if(guestMode === "default") toggleTableInteractionState(document.getElementById(this.id), "seat");
    else if(guestMode === "select_position_group") finishGroupPlacement(document.getElementById(this.id));
    else if(guestMode === "select_position_person") finishPersonPlacement(document.getElementById(this.id));
    else alert("Bitte wählen Sie zuerst eine Gruppe aus der Gästeliste aus, bevor Sie einen Sitzplatz zuweisen können.");
}


function toggleTableInteractionState(button, type, removeInformation = true){
    // for tableInteractionButton -> id from table
    // for seatInteractionButton -> id from table wrapper
    // though these are equal, so no difference in usage
    let tableId;
    if(type === "table") tableId = button.parentElement.id.split("-")[1]; 
    else if(type === "seat") tableId = button.parentElement.parentElement.id.split("-")[1];
    else return;

    // if this button is already open, we need to close it
    if(openInteractionButton == button.id){
        // reset background image, reset open interaction button variable
        openInteractionButton = "";
        openInteractionButtonType = "";
        button.style.backgroundImage = "";

        // hide extended table Number information, and show all buttons of this table again
        if(type === "table"){
            let tableNumberInformation = document.getElementById("table_number_information-" + tableId);
            tableNumberInformation.innerText = tableNumberInformation.innerText.replace(" (Automatisch)", "").replace(" (Manuell)", "");

            // remove action buttons that were open
            removeActionButtonsForTable(removeInformation);
        }else if(type === "seat"){
            removeActionButtonsForSeat();
        }

        // show all buttons of this table again
        showThisTableInteractionButtons(tableId);
        return;
    }

    // close currently open interaction, if there is one
    if(openInteractionButton !== ""){
        toggleTableInteractionState(document.getElementById(openInteractionButton), openInteractionButtonType, removeInformation);
    }

    // change current open interaction button, update background image to show an x
    openInteractionButton = button.id;
    openInteractionButtonType = type;
    button.style.backgroundImage = "url('./icons/close_interaction_menu.svg')";

    // update table number information element to show manual/automatic
    if(type === "table"){
        let tableNumberInformation = document.getElementById("table_number_information-" + tableId);
        if(button.parentElement.dataset.number==="null"){
            tableNumberInformation.innerText = tableNumberInformation.innerText + " (Automatisch)";
        }else{
            tableNumberInformation.innerText = tableNumberInformation.innerText + " (Manuell)";
        }

        createActionButtonsForTable(button);
    }else if(type === "seat"){
        createActionButtonsForSeat(button);
    }

    // hide all other buttons of this table, except for the interaction button
    hideThisTableInteractionButtons(tableId);
    if(type === "table"){
        button.style.display = "inline-block";
        document.getElementById("table_number_information-" + tableId).style.display = "inline-block";
    }
    else if(type === "seat"){
        button.parentElement.style.display = "inline-block";
        document.getElementById("seat_number_information-" + tableId + "." + button.id.split(".")[1]).style.display = "inline-block";
    }
}


function createActionButtonsForTable(button){
    // create and set Attributes for action buttons
    let changeNumberButton = document.createElement("button");
    let rotateButton = document.createElement("button");
    let moveButton = document.createElement("button");
    let deleteButton = document.createElement("button");
    let tableInformation = document.createElement("p");

    changeNumberButton.setAttribute("id", "change_number_button");
    rotateButton.setAttribute("id", "rotate_button");
    moveButton.setAttribute("id", "move_button");
    deleteButton.setAttribute("id", "delete_button");
    tableInformation.setAttribute("id", "table_information");

    changeNumberButton.setAttribute("class", "table_interaction_button");
    rotateButton.setAttribute("class", "table_interaction_button");
    moveButton.setAttribute("class", "table_interaction_button");
    deleteButton.setAttribute("class", "table_interaction_button");
    tableInformation.setAttribute("class", "table_information");

    // add buttons, figure out table
    let table = button.parentElement;
    table.appendChild(changeNumberButton);
    table.appendChild(rotateButton);
    table.appendChild(moveButton);
    table.appendChild(deleteButton);
    table.appendChild(tableInformation);
    updateTableInformation(table, true);

    // positions and background images are handled via CSS
    // add event listeners for buttons
    changeNumberButton.addEventListener('click', changeNumberButtonClick);
    rotateButton.addEventListener('click', rotateTableButtonClick);
    moveButton.addEventListener('click', moveTableButtonClick);
    deleteButton.addEventListener('click', deleteTableButtonClick);
}


function createActionButtonsForSeat(button){
    // create and set Attributes for action buttons
    let movePersonButton = document.createElement("button");
    let moveGroupButton = document.createElement("button");
    let deleteGroupButton = document.createElement("button");
    let deletePersonButton = document.createElement("button");

    movePersonButton.setAttribute("id", "move_person_button");
    moveGroupButton.setAttribute("id", "move_group_button");
    deleteGroupButton.setAttribute("id", "delete_group_button");
    deletePersonButton.setAttribute("id", "delete_person_button");

    movePersonButton.setAttribute("class", "seat_interaction_button");
    moveGroupButton.setAttribute("class", "seat_interaction_button");
    deleteGroupButton.setAttribute("class", "seat_interaction_button");
    deletePersonButton.setAttribute("class", "seat_interaction_button");

    // add buttons, figure out seat
    let seatInteractionButtonWrapper = button.parentElement;
    seatInteractionButtonWrapper.appendChild(movePersonButton);
    seatInteractionButtonWrapper.appendChild(moveGroupButton);
    seatInteractionButtonWrapper.appendChild(deleteGroupButton);
    seatInteractionButtonWrapper.appendChild(deletePersonButton);

    // positions and background images are handled via CSS
    // add event listeners for buttons
    movePersonButton.addEventListener('click', movePersonButtonClick);
    moveGroupButton.addEventListener('click', moveGroupButtonClick);
    deleteGroupButton.addEventListener('click', deleteGroupButtonClick);
    deletePersonButton.addEventListener('click', deletePersonButtonClick);
}


function hideThisTableInteractionButtons(tableId){
    let table = document.getElementById("table-" + tableId);
    let thisTableInteractionButtons = table.querySelectorAll(".hide_on_action");
    for(let i = 0; i < thisTableInteractionButtons.length; i++){
        thisTableInteractionButtons[i].style.display = "none";
    }
}


function showThisTableInteractionButtons(tableId){
    let table = document.getElementById("table-" + tableId);
    let thisTableInteractionButtons = table.querySelectorAll(".hide_on_action");
    for(let i = 0; i < thisTableInteractionButtons.length; i++){
        thisTableInteractionButtons[i].style.display = "inline-block";
    }
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


function hideTableInteractionButtons(){
    let tableInteractionButtons = document.querySelectorAll(".small_table_interaction_button");
    for(let i = 0; i < tableInteractionButtons.length; i++){
        tableInteractionButtons[i].style.display = "none";
    }
}


function showTableInteractionButtons(){
    let tableInteractionButtons = document.querySelectorAll(".small_table_interaction_button");
    for(let i = 0; i < tableInteractionButtons.length; i++){
        tableInteractionButtons[i].style.display = "inline-block";
    }
}


function changeNumberButtonClick(_e){
    // close open table information
    let table = document.getElementById(this.id).parentElement
    let tableInteractionButton = document.getElementById("table_interaction_button-" + table.id.split("-")[1]);
    toggleTableInteractionState(tableInteractionButton, "table", false);
    removeTableInformation();

    // prompt for new number
    let number = window.prompt(
        "Die Bestimmung der Tischnummer kann in 2 wegen erfolgen: Automatisch und Manuell.\n" + 
        " - Automatisch: Nummerierung erfolgt anhand der Reihenfolge, in der die Tische hinzugefügt werden. Beginnend bei 1. Diesen Modus kann durch das Klicken auf 'Abbrechen' ausgewählt werden.\n" + 
        " - Manuell: Nummerierung erfolgt anhand der eingegebenen Nummer. Tisch wird bei der automatische Nummerierung ignoriert.",
        "1"
    );
    // if prompt cancelled -> set to automatic
    if (number===null){
        table.dataset.number = null;
        updateTableNumbers();
        return;
    }
    // validate input, if invalid -> alert and set to automatic
    number = Number(number);
    if (!Number.isInteger(number)) {
        alert("Bitte geben Sie eine gültige Zahl ein.");
        table.dataset.number = null;
        updateTableNumbers();
        return;
    }

    // set new number
    table.dataset.number = number;
    updateTableNumbers();
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
    toggleTableInteractionState(tableInteractionButton, "table", false);
    hideAllActionButtons();

    function rotateTableHandler(e){
        rotateTable(e, tableWrapper, middleOfTableX, middleOfTableY);
    }

    // cancel rotation on escape key, set original rotation
    function cancelRotation(e){
        if(e.key === 'Escape'){
            document.removeEventListener('mousemove', rotateTableHandler);
            document.removeEventListener('click', finishRotation, {capture: true, once: true});
            tableWrapper.style.transform = originalRotation;
            removeTableInformation();
            showAllActionButtons();
        }
    }

    // finish rotation on click
    function finishRotation(e){
        e.stopImmediatePropagation();
        // tabble rotation is done, because it's adjusted automatically during rotation
        // adjust seat button rotations to new table rotation, for this take the inverse of the rotation
        Array.from(tableWrapper.children).slice(1).forEach(seat => {
            let inverseRotation = "rotate(" + String(-Number(tableWrapper.style.transform.replace("rotate(", "").replace("deg)", ""))) + "deg)";
            let originalInverseRotation = "rotate(" + String(-Number(originalRotation.replace("rotate(", "").replace("deg)", ""))) + "deg)";
            seat.style.transform = seat.style.transform.replace(originalInverseRotation, "") + inverseRotation;
        });
        document.removeEventListener('mousemove', rotateTableHandler);
        document.removeEventListener('keydown', cancelRotation);
        removeTableInformation();
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
    updateTableInformation(tableWrapper.parentElement, false);
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
    toggleTableInteractionState(tableInteractionButton, "table", false);
    hideAllActionButtons();

    function moveTableHandler(e){
        moveTable(e, table);
    }

    // cancel move on escape key, set original position
    function cancelMove(e){
        if(e.key === 'Escape'){
            document.removeEventListener('mousemove', moveTableHandler);
            document.removeEventListener('click', finishMove, {capture: true, once: true});
            table.style.left = originalPositionX;
            table.style.top = originalPositionY;
            removeTableInformation();
            showAllActionButtons();
        }
    }

    // finish move on click
    function finishMove(e){
        e.stopImmediatePropagation();
        document.removeEventListener('mousemove', moveTableHandler);
        document.removeEventListener('keydown', cancelMove);
        removeTableInformation();
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
    updateTableInformation(table, false);
}


// delete table after confirmation
function deleteTableButtonClick(_e){
    if(window.confirm("Sind Sie sicher, dass Sie diesen Tisch löschen möchten?")){
        let table = document.getElementById(this.id).parentElement;
        // reset current open interaction button
        toggleTableInteractionState(document.getElementById("table_interaction_button-" + table.id.split("-")[1]), "table", true);

        // reset/clear seat allocations of guests sitting at this table
        let seatButtons = table.querySelectorAll(".seat_interaction_button");
        for(let i = 0; i < seatButtons.length; i++){
            let seatButton = seatButtons[i];
            if(seatButton.dataset.guest === "null") continue;
            let guestNumber = Number(seatButton.dataset.guest);
            guests[guestNumber].seats = [];
        }

        // remove table, update information
        table.remove();
        tableCount--;
        updateTableNumbers();
        updateGuestListContent();
    }
}


function moveGroupButtonClick(_e){
    // get relevant data, initialize selectedGuestNumber
    let seatButton = document.getElementById(this.id).parentElement.firstChild
    let guestNumber = seatButton.dataset.guest;
    if(guestNumber === "null") return;
    selectedGuestNumber = guestNumber;
    // save original seat allocation, so that if escape is pressed -> cancel movement
    originalSeatAllocation = guests[selectedGuestNumber].seats.slice();
    // calculate unassigned guests from group count, so if only x are assigned, only x can be flood filled in the new position
    unassignedGuestsFromGroupCount = guests[selectedGuestNumber].amountOfGuests - guests[selectedGuestNumber].seats.length;

    // set guest mode already, so we don't have to update seat colors twice (deleteGroupFromButton calls it aswell)
    guestMode = "select_position_group";
    // delete group from current seats
    deleteGroupFromButton(seatButton.id);

    // emulate group placement button, group select
    hideTableInteractionButtons()
    document.getElementById("guest-" + selectedGuestNumber).style.backgroundColor = "rgb(255, 160, 160)"

    // cancel movement on escape key
    document.addEventListener('keydown', cancelMoveGroup);
}


function cancelMoveGroup(e){
    if(e.key === 'Escape'){
        // reassign original seats
        guests[selectedGuestNumber].seats = originalSeatAllocation;
        for(let i = 0; i < originalSeatAllocation.length; i++){
            document.getElementById(originalSeatAllocation[i]).dataset.guest = selectedGuestNumber;
        }

        // reset variables, update seat colors and guest list
        guestMode = "default";
        selectedGuestNumber = null;
        updateTableSeatColors(null, null);
        updateGuestListContent();
        showTableInteractionButtons();
        document.removeEventListener('keydown', cancelMoveGroup);

        originalSeatAllocation = [];
        unassignedGuestsFromGroupCount = 0;
    }
}


function movePersonButtonClick(_e){
    // get relevant data, initialize selectedGuestNumber
    let seatButton = document.getElementById(this.id).parentElement.firstChild
    let guestNumber = seatButton.dataset.guest;
    if(guestNumber === "null") return;

    if(!deletePersonFromButton(seatButton.id)) return;
    originalSeatAllocation = [seatButton.id];

    // set guest mode, update seat colors, guest list
    selectedGuestNumber = guestNumber;
    guestMode = "select_position_person";
    updateTableSeatColors(null, true);
    updateGuestListContent();

    // emulate person placement button, person select
    hideTableInteractionButtons()
    document.getElementById("guest-" + selectedGuestNumber).style.backgroundColor = "rgb(255, 160, 160)"

    // cancel movement on escape key
    document.addEventListener('keydown', cancelMovePerson);
}


function cancelMovePerson(e){
    if(e.key === 'Escape'){
        // reassign original seat
        document.getElementById(originalSeatAllocation[0]).dataset.guest = selectedGuestNumber;
        guests[selectedGuestNumber].seats.push(originalSeatAllocation[0]);

        // reset variables, update seat colors and guest list
        guestMode = "default";
        selectedGuestNumber = null;
        updateTableSeatColors(null, null);
        updateGuestListContent();
        showTableInteractionButtons();
        document.removeEventListener('keydown', cancelMovePerson);

        originalSeatAllocation = [];
    }
}


function deleteGroupButtonClick(_e){
    let seatButton = document.getElementById(this.id).parentElement.firstChild
    if(seatButton.dataset.guest === "null") return;
    if(window.confirm("Sind Sie sicher, dass Sie diese Gäste von der Sitzplatzzuweisung löschen möchten?")){
        deleteGroupFromButton(seatButton.id)
    }
}


function deleteGroupFromButton(id){
    let seatButton = document.getElementById(id);
    let seatButtonWrapper = seatButton.parentElement;
    let guestNumber = Number(seatButton.dataset.guest);

    // remove guest from seats
    let seats = guests[guestNumber].seats
    for(let i = 0; i < seats.length; i++){
        document.getElementById(seats[i]).dataset.guest = null;
    }
    // clear guest seat list
    guests[guestNumber].seats = [];

    // update colors and guest list
    // seatButtonWrapper -> table wrapper -> table -> id
    updateTableSeatColors(seatButtonWrapper.parentElement.parentElement.id, true);
    updateGuestListContent();
    toggleTableInteractionState(seatButton, "seat");
}


function deletePersonButtonClick(_e){
    let seatButton = document.getElementById(this.id).parentElement.firstChild
    if(seatButton.dataset.guest === "null") return;
    if(window.confirm("Sind Sie sicher, dass Sie diesen Gast von der Sitzplatzzuweisung löschen möchten?")){
        deletePersonFromButton(seatButton.id)
    }
}


function deletePersonFromButton(id){
    let seatButton = document.getElementById(id);
    seatButton.dataset.floodFilled = "true"; // set to avoid the flood fill from passing through this seat
    let guestNumber = Number(seatButton.dataset.guest);
    let seats = guests[guestNumber].seats;
    let seatIndex = seats.indexOf(seatButton.id);
    let seatPrefix = seatButton.id.split(".")[0];

    // start flood fill from any other seat in the group
    let stack = [seatIndex == 0 ? guests[guestNumber].seats[1] : guests[guestNumber].seats[0]];
    let amount = 0;
    // flood fill all seats connected to any other seat of the group
    while (stack.length > 0){
        // get current seat, continue if it is already flood filled, isn't from the same group or does not exist (can happen with neighboring seats)
        let currentSeat = document.getElementById(stack.shift());
        if(currentSeat === null || currentSeat.dataset.floodFilled === "true" || currentSeat.dataset.guest !== seatButton.dataset.guest) continue;
        // set flood filled, increase amount
        currentSeat.dataset.floodFilled = "true";
        amount++;
        let seatIdNumber = Number(currentSeat.id.split(".")[1]);
        // add neighboring seats to stack
        stack.push(
            seatPrefix + "." + (seatIdNumber + (seatIdNumber % 2 === 0 ? 1 : -1)),
            seatPrefix + "." + (seatIdNumber - 2),
            seatPrefix + "." + (seatIdNumber + 2)
        );
    }

    // in this case (amount of seats remains the same) the seat can be deleted without splitting the group
    let success = false;
    if(amount == guests[guestNumber].seats.length - 1){
        // remove seat from guest
        seatButton.dataset.guest = null;
        seatButton.dataset.floodFilled = "false";
        seats.splice(seatIndex, 1);

        // update colors and guest list
        updateTableSeatColors(seatButton.parentElement.parentElement.parentElement.id, null);
        updateGuestListContent();
        success = true;
    }else{
        // alert user that deleting this guest would split the group
        alert("Dieser Gast ist ein Verbindungsglied zwischen mehreren Gästen der Gruppe. Das Löschen dieses Gastes würde die Gruppe teilen. Bitte wählen Sie einen anderen Gast.");
    }

    // reset flood filled for seats
    for(let i = 0; i < seats.length; i++){
        document.getElementById(seats[i]).dataset.floodFilled = "false";
    }
    toggleTableInteractionState(seatButton, "seat");
    return success;
}


function removeActionButtonsForTable(removeInformation = true){
    if(document.getElementById("change_number_button")) document.getElementById("change_number_button").remove()
    if(document.getElementById("rotate_button")) document.getElementById("rotate_button").remove();
    if(document.getElementById("move_button")) document.getElementById("move_button").remove();
    if(document.getElementById("delete_button")) document.getElementById("delete_button").remove();
    if(removeInformation) removeTableInformation();
}


function removeActionButtonsForSeat(){
    if(document.getElementById("move_person_button")) document.getElementById("move_person_button").remove();
    if(document.getElementById("move_group_button")) document.getElementById("move_group_button").remove();
    if(document.getElementById("delete_group_button")) document.getElementById("delete_group_button").remove();
    if(document.getElementById("delete_person_button")) document.getElementById("delete_person_button").remove();
}


function updateTableInformation(table, addNumberInfo){
    // update table information element, with x, y and rotation
    let tableInformation = document.getElementById("table_information");
    if(tableInformation !== null){
        tableInformation.innerText = 
            `X: ${table.style.left}, Y: ${table.style.top},\n` + 
            `Rotation: ${table.firstChild.style.transform.replace("rotate(", "").replace("deg)", "")}°`;
    }
}


function removeTableInformation(){
    let tableInformation = document.getElementById("table_information");
    if(tableInformation !== null){
        tableInformation.remove();
    }
}


function updateTableNumbers(withoutGuestListUpdate = false){
    let tableNumber = 1;
    // loop over all tables by their ids
    for(let i = 0; i < tableNextId; i++){
        let table = document.getElementById("table-" + i);
        if(table===null) continue
        // it table exists -> check if it has a manual number, if so set it, if not set it to current table number counter
        let tableNumberInformation = document.getElementById("table_number_information-" + i);
        if(table.dataset.number==="null"){
            table.dataset.shownNumber = tableNumber;
            tableNumber++;
        }else{
            table.dataset.shownNumber = table.dataset.number;
        }
        // adjust text
        tableNumberInformation.innerText = `Tisch ${table.dataset.shownNumber}`;
    }

    // the guest list references tables numbers, so each update needs an update of the guest list content
    if(!withoutGuestListUpdate) updateGuestListContent();
}


function updateGuestList(){
    // remove all current guests
    let currentGuests = document.querySelectorAll(".guest");
    for(let i = 0; i < currentGuests.length; i++){
        let guestElement = document.getElementById("guest-" + i);
        if(guestElement) guestElement.remove();
    }

    // add new ones
    let guestList = document.getElementById("guest_list");
    for(let i = 0; i < guests.length; i++){

        // guest wrapper
        let guest = document.createElement("div");
        guest.setAttribute("id", "guest-" + i);
        guest.setAttribute("class", "guest");
        guestList.appendChild(guest);
        guest.addEventListener('click', selectPersonFromGuestList);
        guest.addEventListener('mouseover', toggleHighlightGuestList);
        guest.addEventListener('mouseout', toggleHighlightGuestList);

        // add <p> elements for name, amount of guests, neighbors and assigned seats in guest wrapper
        let guestName = document.createElement("p");
        guestName.setAttribute("id", "guest_name-" + i);
        guestName.setAttribute("class", "guest_name");
        guest.appendChild(guestName);

        let guestAmount = document.createElement("p");
        guestAmount.setAttribute("id", "guest_amount-" + i);
        guestAmount.setAttribute("class", "guest_amount");
        guest.appendChild(guestAmount);

        let guestNeighbors = document.createElement("p");
        guestNeighbors.setAttribute("id", "guest_neighbors-" + i);
        guestNeighbors.setAttribute("class", "guest_neighbors");
        guest.appendChild(guestNeighbors);

        let guestSeats = document.createElement("p");
        guestSeats.setAttribute("id", "guest_seats-" + i);
        guestSeats.setAttribute("class", "guest_seats");
        guest.appendChild(guestSeats);
    }

    // update content, because it sets the text and colors based on the seat allocations
    updateGuestListContent();
}


function updateGuestListContent(){
    for(let i = 0; i < guests.length; i++){
        // put text inside the <p> elements created in updateGuestList
        let guestName = document.getElementById("guest_name-" + i);
        guestName.innerText = guests[i].name;

        let guestAmount = document.getElementById("guest_amount-" + i);
        guestAmount.innerText = guests[i].amountOfGuests;

        let guestNeighbors = document.getElementById("guest_neighbors-" + i);
        // get neighbor names
        let neighbor1 = guests[i].neighbor1 !== null ? guests[guests[i].neighbor1].name : ""
        let neighbor2 = guests[i].neighbor2 !== null ? guests[guests[i].neighbor2].name : ""
        guestNeighbors.innerText = 
            // short neighbor names (only first name and first letter of last name) with fallback if no neighbor is wished
            `${neighbor1 == "" ? "Kein Wunsch" : neighbor1.substring(0, neighbor1.indexOf(",") + 3) + "."} und ` +
            `${neighbor2 == "" ? "Kein Wunsch" : neighbor2.substring(0, neighbor2.indexOf(",") + 3) + "."}`;

        let guestSeats = document.getElementById("guest_seats-" + i);
        // get the id number of the table, for that get the first seat and extract the table id from it
        let seatsAmount = guests[i].seats.length;
        let tableIdNumber = seatsAmount > 0 ? guests[i].seats[0].split("-")[1].split(".")[0] : null;
        if(tableIdNumber !== null){
            let tableText = "Tisch " + document.getElementById("table-" + tableIdNumber).dataset.shownNumber;
            // put the table number first and after that the seat numbers, which are the part after the dot of the seat id
            guestSeats.innerText = tableText + " Sitzplätze" + ": " + guests[i].seats.map(seat => "S" + (Number(seat.split(".")[1]) + 1)).join(", ") + 
                                   " (Insgesamt: " + seatsAmount + ")";
        }else{
            guestSeats.innerText = "Keine Sitzplätze zugewiesen";
        }

        // set color
        let guest = document.getElementById("guest-" + i);
        if(seatsAmount == guests[i].amountOfGuests){
            guest.style.backgroundColor = "rgb(82, 218, 82)";
        }else if(seatsAmount > 0){
            guest.style.backgroundColor = "rgb(255, 240, 104)";
        }else{
            guest.style.backgroundColor = "rgb(238, 238, 238)";
        }
    }
}


function searchGuestList(_e){
    // search term is lower case, because the search should be case insensitive, same for guest names
    let searchTerm = this.value.toLowerCase();
    for(let i = 0; i < guests.length; i++){
        // check if input is part of the guest name, if so show this guest in the list, if not hide it
        if(guests[i].name.toLowerCase().includes(searchTerm)){
            document.getElementById("guest-" + i).style.display = "flex";
        }else{
            document.getElementById("guest-" + i).style.display = "none";
        }
    }
}


//
// Seat Assignment logic
//
function startGroupPlacement(_e){
    if(guestMode === "default"){
        guestMode = "select_group"; // next step is group select
        hideTableInteractionButtons();
        document.addEventListener('keydown', cancelPlacement);
    }else{
        alert("Es ist bereits ein Platzierungsmodus aktiv. Bitte schließen Sie diesen zuerst ab oder brechen Sie ihn mit Escape ab.");
    }
}


function startPersonPlacement(_e){
    if(guestMode === "default"){
        guestMode = "select_person"; // next step is person select
        hideTableInteractionButtons();
        document.addEventListener('keydown', cancelPlacement);
    }else{
        alert("Es ist bereits ein Platzierungsmodus aktiv. Bitte schließen Sie diesen zuerst ab oder brechen Sie ihn mit Escape ab.");
    }
}


function selectPersonFromGuestList(_e){
    if(guestMode === "select_group"){
        // group cannot be placed if it is already or guest count is 0
        if(guests[this.id.split("-")[1]].seats.length !== 0){
            alert("Dieser Gruppe wurde bereits einen Sitzplatz zugewiesen. Bitte wählen Sie eine andere Person oder brechen Sie den Vorgang mit Escape ab.");
            return;
        }
        if(guests[this.id.split("-")[1]].amountOfGuests === 0){
            alert("Diese Gruppe hat keine Personen. Bitte wählen Sie eine andere Person oder brechen Sie den Vorgang mit Escape ab.");
            return;
        }
        guestMode = "select_position_group";
        selectedGuestNumber = this.id.split("-")[1];
        document.getElementById(this.id).style.backgroundColor = "rgb(255, 160, 160)";
        updateTableSeatColors(null, true); // each guestMode has custom seat colors, so update them based on the new guestMode
    }else if(guestMode === "select_person"){
        // cannot be placed if no person in group is assigned or unassigned
        if(guests[this.id.split("-")[1]].seats.length === 0){
            alert("Dieser Gruppe wurde noch keinem Sitzplatz zugewiesen. Nutzen Sie dafür die Gruppenplatzierung. Bitt wählen Sie eine andere Person oder brechen Sie den Vorgang mit Escape ab.");
            return;
        }
        if(guests[this.id.split("-")[1]].amountOfGuests - guests[this.id.split("-")[1]].seats.length === 0){
            alert("Dieser Gruppe wurden bereits alle Personen einem Sitzplatz zugewiesen. Bitte wählen Sie eine andere Person oder brechen Sie den Vorgang mit Escape ab.");
            return;
        }
        guestMode = "select_position_person";
        selectedGuestNumber = this.id.split("-")[1];
        document.getElementById(this.id).style.backgroundColor = "rgb(255, 160, 160)";
        updateTableSeatColors(null, true); // each guestMode has custom seat colors, so update them based on the new guestMode
    }else if(guestMode === "default"){
        // scroll to seat of this guest, if there is one
        let guestNumber = this.id.split("-")[1];
        let guestSeats = guests[guestNumber].seats;
        if(guestSeats.length !== 0){
            document.getElementById(guestSeats[0]).scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
        }
    }else{
        alert("Es ist bereits ein Platzierungsmodus aktiv. Sie können währenddessen keine neue Person auswählen. Bitte schließen Sie diesen zuerst ab oder brechen Sie ihn mit Escape ab.");
    }
}


function colorizeSeats(seats) {
    // define the 3 colors to use, because the table is only 2xn and every group is connected, only 3 colors are needed
    // to ensure that no neighboring seats have the same color.
    // Because the seats are already ordered to go from left to right, it's enough to color them in order, 
    // picking the first color that is not used by a neighbor.
    let colors = [
        "rgb(200, 255, 203)",
        "rgb(180, 255, 255)",
        "rgb(200, 191, 255)",
    ];

    // build guest list, map from guests to their seats and map from guests to their neighboring seats
    let guests = [];
    let guestSeatMap = new Map();
    let guestNeighborMap = new Map();
    // loop over all seats that are occupied, find out seatPrefix (before dot) and seatIdNumber (after dot)
    for(let i = 0; i < seats.length; i++){
        let seat = seats[i];
        let [seatPrefix, seatIdNumber] = seat.id.split(".");
        seatIdNumber = Number(seatIdNumber);

        // if guest is not in guest list, add them and initialize their seat and neighbor map entry
        if(!guests.includes(seat.dataset.guest)){
            guests.push(seat.dataset.guest);
            guestSeatMap.set(seat.dataset.guest, []);
            guestNeighborMap.set(seat.dataset.guest, []);
        }

        // add seat to map, figure out neighboring seats of this seat
        guestSeatMap.get(seat.dataset.guest).push(seat);
        let neighborSeatIds = [
            seatPrefix + "." + (seatIdNumber + (seatIdNumber % 2 === 0 ? 1 : -1)),
            seatPrefix + "." + (seatIdNumber - 2),
            seatPrefix + "." + (seatIdNumber + 2)
        ]
        // loop over neighboring seats, if they are occupied, not part of the same guest and not already added as neighbor, 
        // add them as neighbor
        for(let j = 0; j < neighborSeatIds.length; j++){
            let neighborSeat = document.getElementById(neighborSeatIds[j]);
            if(neighborSeat === null) continue;
            if(neighborSeat.dataset.guest === "null") continue;
            if(neighborSeat.dataset.guest === seat.dataset.guest) continue
            if(guestNeighborMap.get(seat.dataset.guest).includes(neighborSeat)) continue;
            guestNeighborMap.get(seat.dataset.guest).push(neighborSeat);
        }
    }

    // loop over all guests, get the neighboring seats (using the map), initialize used colors list
    for(let i = 0; i < guests.length; i++){
        let guest = guests[i];
        let usedColors = [];
        let neighborSeats = guestNeighborMap.get(guest);

        // loop over neighboring seats, tracking thier color, if it is one of the defined colors and not already added to used colors
        for(let j = 0; j < neighborSeats.length; j++){
            let neighborSeat = neighborSeats[j];
            let neighborColor = neighborSeat.style.backgroundColor;
            if(colors.includes(neighborColor) && !usedColors.includes(neighborColor)){
                usedColors.push(neighborColor);
            }
        }
        // loop over defined colors, picking the first that is not used, then loop over all seats from this guest and set the color
        for(let k = 0; k < colors.length; k++){
            if(!usedColors.includes(colors[k])){
                let guestSeats = guestSeatMap.get(guest);
                for(let l = 0; l < guestSeats.length; l++){
                    guestSeats[l].style.backgroundColor = colors[k];
                }
                break;
            }
        }
    }
}


function updateTableSeatColors(tableId = null, doFullUpdate = false){
    let seats;
    // get seats, if tableId is null get all seats, if not get only the seats of the table with the given id
    if(tableId === null){
        seats = document.querySelectorAll(".small_seat_interaction_button");
    }else{
        seats = document.getElementById(tableId).querySelectorAll(".small_seat_interaction_button");
    }
    if(guestMode === "default" || guestMode === "select_group" || guestMode === "select_person"){
        // if no position select mode is active, get all occupied seats, and color them so no two neighbors have the same color
        let occupiedSeats = []
        for(let i = 0; i < seats.length; i++){
            let seat = seats[i];
            if(seat.dataset.guest === "null") seat.style.backgroundColor = "rgb(238, 238, 238)";
            else occupiedSeats.push(seat);
        }
        if(occupiedSeats.length > 0) colorizeSeats(occupiedSeats);
    }else if(guestMode === "select_position_person"){
        // loop over all seats, set all of them to yellow (= not possible position for selected guest)
        // -> later possible positions are made green
        for(let i = 0; i < seats.length; i++){
            seats[i].style.backgroundColor = "rgb(255, 246, 168)";
        }

        // loop over all seats of the currently selected guest to highlight the neighboring, empty seats as possible positions for the selected guest
        for(let j = 0; j < guests[selectedGuestNumber].seats.length; j++){
            let [seatPrefix, seatIdNumber] = guests[selectedGuestNumber].seats[j].split(".");
            seatIdNumber = Number(seatIdNumber);
            let neighborSeatIds = [
                seatPrefix + "." + (seatIdNumber + (seatIdNumber % 2 === 0 ? 1 : -1)),
                seatPrefix + "." + (seatIdNumber - 2),
                seatPrefix + "." + (seatIdNumber + 2)
            ]

            // loop over the neighboring seats, if one is empty, highlight it as possible position for the selected guest
            for(let k = 0; k < neighborSeatIds.length; k++){
                let neighborSeat = document.getElementById(neighborSeatIds[k]);
                if(neighborSeat === null) continue;
                if(neighborSeat.dataset.guest === "null"){
                    neighborSeat.style.backgroundColor = "rgb(200, 255, 203)";
                }
            }
        }
    }else if(guestMode === "select_position_group"){
        for(let i = 0; i < seats.length; i++){
            let seat = seats[i];
            // reset flood filled seats
            if(seat.dataset.floodFilled === "false" && !doFullUpdate) continue;
            seat.dataset.floodFilled = "false";

            if(seat.dataset.guest === "null"){
                seat.style.backgroundColor = "rgb(238, 238, 238)"; // empty seats get gray background
            }else{
                seat.style.backgroundColor = "rgb(255, 246, 168)"; // occupied seats get yellow background
            }
        }

        // get all favorable neighbors for the currently selected guest, includes:
        // - the neighbors wished by the guest
        // - the guests that wish the selected guest as a neighbor
        let favorableNeighborGuestIdNumbers = [];
        let neighbor1 = guests[selectedGuestNumber].neighbor1;
        let neighbor2 = guests[selectedGuestNumber].neighbor2;
        if(neighbor1 !== null) favorableNeighborGuestIdNumbers.push(Number(neighbor1));
        if(neighbor2 !== null) favorableNeighborGuestIdNumbers.push(Number(neighbor2));

        for(let i = 0; i < guests.length; i++){
            // only == because selectedGuestNumber is a string, because it comes from dataset
            if(guests[i].neighbor1 == selectedGuestNumber || guests[i].neighbor2 == selectedGuestNumber){
                favorableNeighborGuestIdNumbers.push(i);
            }
        }

        // loop over all favorable neighbors, get their seats
        for(let i = 0; i < favorableNeighborGuestIdNumbers.length; i++){
            let favorableNeighborGuestSeats = guests[favorableNeighborGuestIdNumbers[i]].seats;
            // loop over their seats, get the neighboring seats of them
            for(let j = 0; j < favorableNeighborGuestSeats.length; j++){
                let [seatPrefix, seatIdNumber] = favorableNeighborGuestSeats[j].split(".");
                seatIdNumber = Number(seatIdNumber);
                let neighborSeatIds = [
                    seatPrefix + "." + (seatIdNumber + (seatIdNumber % 2 === 0 ? 1 : -1)),
                    seatPrefix + "." + (seatIdNumber - 2),
                    seatPrefix + "." + (seatIdNumber + 2)
                ]

                // loop over the neighboring seats, if one is empty, highlight it as favorable neighbor seat
                for(let k = 0; k < neighborSeatIds.length; k++){
                    let neighborSeat = document.getElementById(neighborSeatIds[k]);
                    if(neighborSeat === null) continue;
                    if(neighborSeat.dataset.guest === "null"){
                        neighborSeat.style.backgroundColor = "rgb(200, 255, 203)";
                    }
                }
            }
        }
    }
}


function toggleHighlight(e){
    if(guestMode === "default" || guestMode === "select_group" || guestMode === "select_person"){
        if(e.type === "mouseover"){
            let seat = document.getElementById(this.id);
            if(seat.dataset.guest === "null") return;
            // color all seat of the same guest
            let guestNumber = Number(seat.dataset.guest);
            let guestSeats = guests[seat.dataset.guest].seats;
            for(let i = 0; i < guestSeats.length; i++){
                document.getElementById(guestSeats[i]).style.backgroundColor = "rgb(255, 215, 215)";
            }

            // highight guest element in guest list, jump to it
            let guestElement = document.getElementById("guest-" + guestNumber);
            guestElement.style.backgroundColor = "rgb(255, 215, 215)";
            guestElement.scrollIntoView({behavior: "smooth", block: "start"});
        }else{
            // reset colors of all seats of the same guest, and color of guest element in guest list
            if(document.getElementById(this.id).dataset.guest === "null") return;
            updateTableSeatColors(document.getElementById(this.id).parentElement.parentElement.parentElement.id, null);
            updateGuestListContent();
        }
    }else if(guestMode === "select_position_group"){
        if(e.type === "mouseover"){
            // set values, return if seat already occupied
            let seat = document.getElementById(this.id);
            if(seat.dataset.guest !== "null") return;
            let seatPrefix = this.id.split(".")[0];

            // manual overwrite if guests count is a multiple of 4, so that all guests are sitting opposite of another
            let guestCount = guests[selectedGuestNumber].amountOfGuests - unassignedGuestsFromGroupCount;
            if(guestCount / 4 == Math.floor(guestCount / 4)){
                let succesful = true;
                // check if all seats, starting from a seat with an even number, so that a rectangle gets formed
                let seatNumber = Number(this.id.split(".")[1]);
                // offset it a little (half of the guest count), add one if the seatNumber is uneven, to make it a rectangle
                let offsetSeatNumber = seatNumber - Math.floor(guestCount / 4) * 2 + (seatNumber % 2 === 0 ? 0 : 1);
                for (let seatNumber = offsetSeatNumber; seatNumber < offsetSeatNumber + guestCount; seatNumber++) {
                    let seat = document.getElementById(seatPrefix + "." + seatNumber);
                    if (seat === null || seat.dataset.guest !== "null" ) {
                        succesful = false;
                        break;
                    }
                }

                if(succesful){
                    // if so, color them and set flood filled, so they work on seat click
                    for (let seatNumber = offsetSeatNumber; seatNumber < offsetSeatNumber + guestCount; seatNumber++) {
                        document.getElementById(seatPrefix + "." + seatNumber).dataset.floodFilled = "true";
                        document.getElementById(seatPrefix + "." + seatNumber).style.backgroundColor = "rgb(255, 160, 160)";
                    }
                    // return, so flood fill doesn't take place -> not needed
                    return;
                }
            }


            let stack = [this.id];
            let amount = 0;
            // flood fill all seats up to amount of guests, and highlight them
            while (stack.length > 0 && amount < guestCount){
                // get current seat, continue if it is already flood filled or does not exist (can happen with neighboring seats)
                let currentSeat = document.getElementById(stack.shift());
                if(currentSeat === null || currentSeat.dataset.floodFilled === "true" || currentSeat.dataset.guest !== "null") continue;
                // set flood filled, highlight seat, increase amount
                currentSeat.dataset.floodFilled = "true";
                currentSeat.style.backgroundColor = "rgb(255, 160, 160)";
                amount++;
                let seatIdNumber = Number(currentSeat.id.split(".")[1]);
                // add neighboring seats to stack
                stack.push(
                    seatPrefix + "." + (seatIdNumber + (seatIdNumber % 2 === 0 ? 1 : -1)),
                    seatPrefix + "." + (seatIdNumber - 2),
                    seatPrefix + "." + (seatIdNumber + 2)
                );
            }
        }else {
            if(document.getElementById(this.id).dataset.guest !== "null") return;
            // seat button -> seat wrapper -> table wrapper -> table -> table id
            updateTableSeatColors(document.getElementById(this.id).parentElement.parentElement.parentElement.id, false);
        }
    }
}


function toggleHighlightGuestList(e){
    if(guestMode === "default" || guestMode === "select_group" || guestMode === "select_person"){
        // if no position select mode is active, highlight guest seats and that correspond to the guest element hovered over
        let guestNumber = this.id.split("-")[1];
        let guestSeats = guests[guestNumber].seats;
        if(e.type === "mouseover"){
            for(let i = 0; i < guestSeats.length; i++){
                document.getElementById(guestSeats[i]).style.backgroundColor = "rgb(255, 215, 215)";
            }
        }else{
            if(guestSeats.length === 0) return;
            updateTableSeatColors("table-" + guestSeats[0].split("-")[1].split(".")[0], null);
        }
    }
}


function finishGroupPlacement(seat){
    // seat button -> seat wrapper -> table wrapper -> children -> children (without table segment wrapper) -> seat buttons
    let seats = Array.from(seat.parentElement.parentElement.children).slice(1).map(seat => seat.firstChild);
    for(let i = 0; i < seats.length; i++){
        if(seats[i].dataset.floodFilled === "true"){
            seats[i].dataset.guest = selectedGuestNumber;
            seats[i].dataset.floodFilled = "false";
            guests[selectedGuestNumber].seats.push(seats[i].id);
        }
    }

    // reset values and colors, update guest list
    guestMode = "default";
    selectedGuestNumber = null;
    updateTableSeatColors(null, null);
    updateGuestListContent();
    showTableInteractionButtons();

    // reset variables from movement
    originalSeatAllocation = [];
    unassignedGuestsFromGroupCount = 0;
    // remove move group cancel event listener!
    document.removeEventListener('keydown', cancelMoveGroup);
    // and group placement event listener
    document.removeEventListener('keydown', cancelPlacement); 
}


function finishPersonPlacement(seat){
    if(seat.style.backgroundColor !== "rgb(200, 255, 203)"){ // check if seat is valid position -> just use color, because only valid positions are colored green
        alert("Dieser Sitzplatz ist kein Nachbar eines bereits zugewiesenen Sitzplatzes der Gruppe. Bitte wählen Sie einen anderen Sitzplatz (grün) oder brechen Sie den Vorgang mit Escape ab.");
        return;
    }

    // set guest
    seat.dataset.guest = selectedGuestNumber;
    guests[selectedGuestNumber].seats.push(seat.id);

    // reset values and colors, update guest list
    guestMode = "default";
    selectedGuestNumber = null;
    updateTableSeatColors(null, null);
    updateGuestListContent();
    showTableInteractionButtons();

    // reset variables from movement
    originalSeatAllocation = [];
    // remove move person cancel event listener!
    document.removeEventListener('keydown', cancelMovePerson);
    // and person placement event listener
    document.removeEventListener('keydown', cancelPlacement);
}


function cancelPlacement(e){
    if(e.key === 'Escape'){
        if(guestMode === "select_position_group" || guestMode === "select_position_person"){
            // reset values and colors, update guest list
            guestMode = "default";
            selectedGuestNumber = null;
            updateTableSeatColors(null, null);
            updateGuestListContent();
        }else {
            guestMode = "default";
        }
        // show buttons, remove event listener for cancel
        showTableInteractionButtons();
        document.removeEventListener('keydown', cancelPlacement);
    }
}


//
// Import Guests from Excel
//
function importGuests(_e){
    // warning
    if(!window.confirm("Die aktuellen Gäste werden durch die neuen ersetzt. Bisherige Zuordnungen werden entfernt. Möchten Sie fortfahren?")) return;

    // get first file uploaded, end if none are
    let file = importGuestsFileInput.files[0]
    if(!file){
        alert("Bitte wählen Sie eine Datei zum Importieren aus.");
        return;
    }

    // clear current guest allocations
    let allSeats = document.querySelectorAll(".small_seat_interaction_button");
    for(let i = 0; i < allSeats.length; i++){
        allSeats[i].dataset.guest = null;
        allSeats[i].dataset.floodFilled = "false";
    }

    let reader = new FileReader();
    reader.onload = (e) => {
        // open workbook
        let workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        // Access first sheet and data
        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];
        let data = XLSX.utils.sheet_to_json(worksheet);
        let guest_names = [];

        // construct guest names list
        for(let i = 0; i < data.length; i++){
            guest_names.push(data[i]['Name']);
        }

        // add relevant data to guests list
        for(let i = 0; i < data.length; i++){
            let neighbor1 = data[i]['WunschNachbar1'];
            let neighbor2 = data[i]['WunschNachbar2'];
            guests.push({
                name: guest_names[i],
                amountOfGuests: data[i]['Personenzahl'],
                neighbor1: neighbor1 == "" ? null : guest_names.indexOf(neighbor1) == -1 ? null : guest_names.indexOf(neighbor1),
                neighbor2: neighbor2 == "" ? null : guest_names.indexOf(neighbor2) == -1 ? null : guest_names.indexOf(neighbor2),
                seats: []
            });
        }

        // update guest list to show new guests
        updateGuestList();
    };
    // actually read the file and run onload function
    reader.readAsArrayBuffer(file);
}


//
// Exort / Import Layout
//
function verifyJSON(json){
    // if important data is missing, alert user and return false, otherwise return true
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
    if(!window.confirm("Das aktuelle Layout wird durch das importierte Layout ersetzt. Möchten Sie fortfahren?")) return;
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
            table.rotation ?? "rotate(0deg)"
        );
        addTableInteractionButton(table.id);
        addTableNumberInformation(table.id, table.number ?? "null")
        addSeatInteractionButtons(table.id, table.rotation ?? "rotate(0deg)");
    }
    guests = json.guests ?? [];
    
    // update guest allocations to seats
    for (let i = 0; i < guests.length; i++){
        for (let j = 0; j < guests[i].seats.length; j++){
            let seat = document.getElementById(guests[i].seats[j]);
            if(seat) seat.dataset.guest = i;
        }
    }

    // update colors and guest list to reflect new layout and guest allocations
    updateTableNumbers(true);
    updateGuestList();
    updateTableSeatColors(null, null);
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
        guests: guests,
        tableCount: tableCount,
        tableNextId: tableNextId
    };
    // then add each table's data
    for(let i = 0; i < tableNextId; i++){
        let table = document.getElementById("table-" + i);
        if(table){
            layoutData.tables.push({
                id: i,
                number: table.dataset.number,
                position: {
                    left: table.style.left,
                    top: table.style.top
                },
                rotation: table.firstChild.style.transform,
                length: table.firstChild.firstChild.children.length
            });
        }
    }
    return layoutData;
}


function exportSeating(){
    // export seating data as json, for that loop over guests and extract name, table and seat numbers
    let seatingData = [];
    for(let i = 0; i < guests.length; i++){
        seatingData.push({
            Name: guests[i].name,
            Tisch: guests[i].seats.length > 0 ? "Tisch " + document.getElementById("table-" + guests[i].seats[0].split("-")[1].split(".")[0]).dataset.shownNumber : "Kein Tisch",
            Sitzplätze: guests[i].seats.length > 0 ? guests[i].seats.map(seat => "S" + (Number(seat.split(".")[1]) + 1)).join(", ") : "Keine Sitzplätze"
        });
    }
    return seatingData;
}


function downloadFile(file){
    // Create a link add url to file
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(file);
    link.download = file.name;

    // click link to download, for that add it to DOM
    document.body.appendChild(link);
    link.click();

    // wait a little before removing to make sure it works on firefox
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.parentNode.removeChild(link);
    }, 0);
}


function downloadLayoutFile(_e){
    downloadFile(new File([JSON.stringify(exportLayout())], "Tisch-Layout.json"));
}


function downloadSeatingFile(_e){
    // convert seating data to worksheet and workbook, then export as xlsx file
    let worksheet = XLSX.utils.json_to_sheet(exportSeating());
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sitzplatzzuweisung");
    XLSX.writeFile(workbook, "Sitzplatzzuweisung.xlsx");
}


// add confirmation when leaving the page
window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "Sicher? Ungespeicherte Änderungen gehen verloren.";
    return "Sicher? Ungespeicherte Änderungen gehen verloren.";
});