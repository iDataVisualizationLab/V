function createButton(containerId, clickAction) {
    let container = document.getElementById(containerId);
    let btn = document.createElement("button");
    btn.title = "Click to start/pause";
    btn.classList.add("playpauseBtn");
    container.appendChild(btn);
    btn.addEventListener("click", function () {
        this.classList.toggle("paused");
        if(this.classList.contains("paused")){
            clickAction("start");
        }else{
            clickAction("pause");
        }
    });
}
