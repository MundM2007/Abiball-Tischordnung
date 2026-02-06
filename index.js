const tableSegmentHeight = 100;
const tableMiddleSegmentWidth = tableSegmentHeight * 70 / 230;

// always open elements
const addTableButton = document.getElementById('add_table_button');
const importGuestsButton = document.getElementById('import_guests_button');
const importGuestsFileInput = document.getElementById('import_guests_file');
const exportButton = document.getElementById('export_button');
const importButton = document.getElementById('import_button');
const importFileInput = document.getElementById('import_file');
const addGroupButton = document.getElementById('add_group_button');
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
exportButton.addEventListener('click', downloadLayoutFile);
importGuestsButton.addEventListener('click', importGuests);
importButton.addEventListener('click', importLayout);
addGroupButton.addEventListener('click', startGroupPlacement);

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

    let tableSegmentWrapper = document.createElement("div");
    tableSegmentWrapper.setAttribute("id", "table_segment_wrapper-" + id)
    tableSegmentWrapper.setAttribute("class", "table_segment_wrapper");
    tableWrapper.appendChild(tableSegmentWrapper)

    tableSegmentWrapper.appendChild(tableEndLeft());
    for(let i = 0; i < length - 2; i++) {
        tableSegmentWrapper.appendChild(tableMiddle());
    }
    tableSegmentWrapper.appendChild(tableEndRight());

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
    else if(guestMode === "select_position_group") finishPlacement(document.getElementById(this.id));
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
    moveGroupButton.addEventListener('click', moveGroupButtonClick);
    deleteGroupButton.addEventListener('click', deleteGroupButtonClick);
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

    let number = window.prompt(
        "Die Bestimmung der Tischnummer kann in 2 wegen erfolgen: Automatisch und Manuell.\n" + 
        " - Automatisch: Nummerierung erfolgt anhand der Reihenfolge, in der die Tische hinzugefügt werden. Beginnend bei 1. Diesen Modus kann durch das Klicken auf 'Abbrechen' ausgewählt werden.\n" + 
        " - Manuell: Nummerierung erfolgt anhand der eingegebenen Nummer. Tisch wird bei der automatische Nummerierung ignoriert.",
        "1"
    );
    if (number===null){
        table.dataset.number = null;
        updateTableNumbers();
        return;
    }
    number = Number(number);
    if (!Number.isInteger(number)) {
        alert("Bitte geben Sie eine gültige Zahl ein.");
        table.dataset.number = null;
        updateTableNumbers();
        return;
    }

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

    // cancel rotation on escape key
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

    // cancel move on escape key
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
        table.remove();
        tableCount--;
        updateTableNumbers();
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
    // TEST !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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

        guestMode = "default";
        selectedGuestNumber = null;
        updateTableSeatColors(null, null);
        updateGuestListContent();
        showTableInteractionButtons();
        document.removeEventListener('keydown', cancelMoveGroup);
    }
}


function deleteGroupButtonClick(_e){
    let seatButton = document.getElementById(this.id).parentElement.firstChild
    if(seatButton.dataset.guest === "null") return;
    if(window.confirm("Sind Sie sicher, dass Sie diese Sitzplatzzuweisung löschen möchten?")){
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
    // update table information element
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
    for(let i = 0; i < tableNextId; i++){
        let table = document.getElementById("table-" + i);
        if(table===null) continue
        let tableNumberInformation = document.getElementById("table_number_information-" + i);
        if(table.dataset.number==="null"){
            table.dataset.shownNumber = tableNumber;
            tableNumber++;
        }else{
            table.dataset.shownNumber = table.dataset.number;
        }
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

//
// Seat Assignment logic
//
function startGroupPlacement(_e){
    if(guestMode === "default"){
        guestMode = "select_group";
        hideTableInteractionButtons();
        document.addEventListener('keydown', cancelGroupPlacement);
    }else{
        alert("Es ist bereits ein Platzierungsmodus aktiv. Bitte schließen Sie diesen zuerst ab oder brechen Sie ihn mit Escape ab.");
    }
}


function selectPersonFromGuestList(_e){
    if(guestMode === "select_group"){
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
        updateTableSeatColors(null, true);
    }else if(guestMode === "default"){
        alert("Es ist kein Platzierungsmodus aktiv. Bitte starten Sie zuerst einen mit den oberen Schaltflächen.");
    }else{
        alert("Es ist bereits ein Platzierungsmodus aktiv. Sie können währenddessen keine neue Person auswählen. Bitte schließen Sie diesen zuerst ab oder brechen Sie ihn mit Escape ab.");
    }
}


function colorizeSeats(seats) {
    // define the 3 colors to use, because the table is only 2xn and every group it connected, only 3 colors are needed, 
    // to ensure that no neighboring seats have the same color
    // because the seats are already ordered to go from left to right, it's enough to color them in order, 
    // picking the first color that is not used by a neighbor
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
    if(tableId === null){
        seats = document.querySelectorAll(".small_seat_interaction_button");
    }else{
        let table = document.getElementById(tableId);
        seats = Array.from(table.firstChild.children).slice(1).map(seat => seat.firstChild);
    }
    if(guestMode === "default" || guestMode === "select_group"){
        let occupiedSeats = []
        for(let i = 0; i < seats.length; i++){
            let seat = seats[i];
            if(seat.dataset.guest === "null") seat.style.backgroundColor = "rgb(238, 238, 238)";
            else occupiedSeats.push(seat);
        }
        if(occupiedSeats.length > 0) colorizeSeats(occupiedSeats);
    }
    if(guestMode === "select_position_group"){
        for(let i = 0; i < seats.length; i++){
            let seat = seats[i];
            // reset flood filled seats
            if(seat.dataset.floodFilled === "false" && !doFullUpdate) continue;
            seat.dataset.floodFilled = "false";

            if(seat.dataset.guest === "null"){
                seat.style.backgroundColor = "rgb(238, 238, 238)";
            }else{
                seat.style.backgroundColor = "rgb(255, 246, 168)";
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

        console.log(favorableNeighborGuestIdNumbers)
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
    if(guestMode === "select_position_group"){
        if(e.type === "mouseover"){
            // set values, return if seat already occupied
            let seat = document.getElementById(this.id);
            if(seat.dataset.guest !== "null") return;
            let seatPrefix = this.id.split(".")[0];

            let stack = [this.id];
            let amount = 0;
            // flood fill all seats up to amount of guests, and highlight them
            while (stack.length > 0 && amount < (guests[selectedGuestNumber].amountOfGuests - unassignedGuestsFromGroupCount)){
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
            // seat button -> seat wrapper -> table wrapper -> table -> table id
            updateTableSeatColors(document.getElementById(this.id).parentElement.parentElement.parentElement.id, false);
        }
    }
}


function finishPlacement(seat){
    if(guestMode === "select_position_group"){
        // seat button -> seat wrapper -> table wrapper -> children -> children (without table segment wrapper) -> seat buttons
        let seats = Array.from(seat.parentElement.parentElement.children).slice(1).map(seat => seat.firstChild);
        for(let i = 0; i < seats.length; i++){
            if(seats[i].dataset.floodFilled === "true"){
                seats[i].dataset.guest = selectedGuestNumber;
                seats[i].dataset.floodFilled = "false";
                guests[selectedGuestNumber].seats.push(seats[i].id);
            }
        }
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
    }
    document.removeEventListener('keydown', cancelGroupPlacement);
}


function cancelGroupPlacement(e){
    if(e.key === 'Escape'){
        if(guestMode === "select_position_group"){
            guestMode = "default";
            selectedGuestNumber = null;
            updateTableSeatColors(null, null);
            updateGuestListContent();
        }else {
            guestMode = "default";
        }
        showTableInteractionButtons();
        document.removeEventListener('keydown', cancelGroupPlacement);
    }
}

//
// Import Guests from Excel
//
function importGuests(_e){
    if(!window.confirm("Die aktuellen Gäste werden durch die neuen ersetzt. Bisherige Zuordnungen werden entfernt. Möchten Sie fortfahren?")) return;

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

        updateGuestList();
    };
    reader.readAsArrayBuffer(file);
}


//
// Exort / Import Layout
//
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


function downloadLayoutFile(_e) {
    let file = new File([JSON.stringify(exportLayout())], "Tisch-Layout.json")

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


// add confirmation when leaving the page
window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "Sicher? Ungespeicherte Änderungen gehen verloren.";
    return "Sicher? Ungespeicherte Änderungen gehen verloren.";
});