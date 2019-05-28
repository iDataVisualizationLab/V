(function () {
    let body = document.getElementsByTagName('body')[0];
    let loaderDiv = document.createElement('div');
    loaderDiv.id = 'loader';
    body.appendChild(loaderDiv);
})();

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function showLoader() {
    document.getElementById("loader").style.display = "block";
}