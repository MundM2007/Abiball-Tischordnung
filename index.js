const moveableButton = document.getElementById('moveableButton1');
moveableButton.dataset.moving = false;

moveableButton.addEventListener('click', toggleMovement);

function toggleMovement(_e) {
    if(moveableButton.dataset.moving === "false"){
        moveableButton.dataset.moving = "true";
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