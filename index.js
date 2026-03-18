const json = {"tables":[],"tableCount":0,"tableNextId":0};
const tableSegmentHeight = 100;
const tableMiddleSegmentWidth = tableSegmentHeight * 70 / 230 // aspect ratio of table middle segment image;

const searchInput = document.getElementById('search_input');
// track amount of tables and next table id
let tableCount = 0;
let tableNextId = 0;
// guest list
let guests = [];

// add event listeners
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
            button.addEventListener('mouseover', toggleHighlight);
            button.addEventListener('mouseout', toggleHighlight);
        }
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


function selectPersonFromGuestList(_e){
    // scroll to seat of this guest, if there is one
    let guestNumber = this.id.split("-")[1];
    let guestSeats = guests[guestNumber].seats;
    if(guestSeats.length !== 0){
        document.getElementById(guestSeats[0]).scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
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
    // if no position select mode is active, get all occupied seats, and color them so no two neighbors have the same color
    let occupiedSeats = []
    for(let i = 0; i < seats.length; i++){
        let seat = seats[i];
        if(seat.dataset.guest === "null") seat.style.backgroundColor = "rgb(238, 238, 238)";
        else occupiedSeats.push(seat);
    }
    if(occupiedSeats.length > 0) colorizeSeats(occupiedSeats);
}


function toggleHighlight(e){
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
}


function toggleHighlightGuestList(e){
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


//
// Import Layout
//
async function importLayout(){
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

importLayout();
