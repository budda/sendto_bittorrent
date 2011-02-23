var defaultColor = "blue";

function loadOptions() {
	var url = localStorage.nasboxurl;
	if(url) { nasboxurl.value = url; }
}

function saveOptions() {
	localStorage.nasboxurl = document.getElementById("nasboxurl").value;
}
