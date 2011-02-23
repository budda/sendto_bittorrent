/* GENERAL PURPOSE FUNCTIONS */
String.prototype.stripTags = function() {
	return this.replace(/<\/?[^>]+>/gi, '');
};

String.prototype.escapeHTML = function() {
	var div = document.createElement('div');
	var text = document.createTextNode(this);
	div.appendChild(text);
	return div.innerHTML;
};
	
String.prototype.unescapeHTML = function() {
	var div = document.createElement('div');
	div.innerHTML = this.stripTags();
	return div.childNodes[0].nodeValue;
};

String.prototype.stripSpaces = function() {
	var t = this.replace(/^\s+/,'');
	var t2 = t.replace(/\s+$/,'');
	return t2;
};

function $(id) {
	if (document.all)
		return document.all[id];
	if (document.getElementById)
		return document.getElementById(id);
	for (var i=1; i<document.layers.length; i++) {
	    if (document.layers[i].id==id)
	      return document.layers[i];
	}
	return false;
}

function makeHttpObject() {
	try {return new XMLHttpRequest();}
	catch (error) {}
	try {return new ActiveXObject("Microsoft.XMLHTTP");}
	catch (error) {}
	try {return new ActiveXObject("Msxml2.XMLHTTP");}
	catch (error) {}
	throw new Error("Could not create HTTP request object.");
}

function evalJson(json) { return eval("(" + json + ")"); }

/* SDK CONTROL OBJECT */
function onReadyStateChangeHandler(sdkCtl, request, onFinished) {
	sdkCtl.onReadyStateChangedHandler(request, onFinished);
}

function SdkCtl() {
	this.refreshFreq = 2000; /* every 2 seconds */

	/* If true, will log url, size and execution time for each requests. It's only
	   for debugging and doesn't work in IE6 because IE6 doesn't allow adding
	   properties to XmlHttpRequest object */
	this.logRequests = false;
	this.reqHistory = new Array();
	this.maxHistoryLen = 10;
	
	this.nasboxurl = '';

this.onReadyStateChangedHandler = function(request, onFinished) {
	if (this.logRequests) {
		request.endTime = new Date();
		var dur = request.endTime.getTime() - request.startTime.getTime();
		var size = request.responseText.length;
		var toStore = [request.req, dur, size];
		var h = this.reqHistory;
		h.push(toStore);
		if (h.length > this.maxHistoryLen)
			h.shift();
	}
	if (onFinished)
		onFinished(request);
};

this.req = function(req, onFinished) {
	var request = makeHttpObject();
	var sdkCtl = this;
  
	request.open("GET", sdkCtl.nasboxurl + req, true);
		
	if (this.logRequests) {
		request.req = req;
		request.startTime = new Date();
	}
	request.onreadystatechange = function() {
		if (4 == request.readyState)
			onReadyStateChangeHandler(sdkCtl, request, onFinished);
	};
	request.send(null);
};

this.appSettingsGet = function(onFinished) {
	this.req("/api/app-settings-get", onFinished);
};

this.appSettingSet = function(name, val, onFinished) {
	var r = "/api/app-settings-set?" + encodeURIComponent(name) + "=" + encodeURIComponent(val);
	this.req(r, onFinished);
};

this.torrentsGet = function(onFinished) {
	this.req("/api/torrents-get", onFinished);
};

this.torrentStop = function(torrentHash, onFinished) {
	this.req("/api/torrent-stop?hash=" + torrentHash, onFinished);
};

this.torrentStart = function(torrentHash, onFinished) {
	this.req("/api/torrent-start?hash=" + torrentHash, onFinished);
};

this.torrentRemove = function(torrentHash, withData, onFinished) {
	var url = "/api/torrent-remove?hash=" + torrentHash;
	url += "&delete-torrent=yes";
	if (withData) url += "&delete-data=yes";
	this.req(url, onFinished);
};

this.torrentGetFiles = function(torrentHash, onFinished) {
	this.req("/api/torrent-get-files?hash=" + torrentHash, onFinished);	
};

this.torrentAddUrl = function(url, start, onFinished) {
	var url = "/api/torrent-add?url=" + encodeURIComponent(url);
	if (start) url += "&start=yes";
	this.req(url, onFinished);
};

this.appSettingsSetUrl = function(settings) {
	var req = "/api/app-settings-set?";
	for (var i = 0; i < settings.length; i++) {
		if (0 != i) req += "&";
		var el = settings[i];
		var arg = encodeURIComponent(el[0]) + "=" + encodeURIComponent(el[1]);
		req += arg;
	}
	return req;
};

this.appSettingsSet = function(settings, onFinished) {
	var req = this.appSettingsSetUrl(settings);
	this.req(req, onFinished);
};

this.torrentFileGet = function(hash, file_id, onFinished) {
	var req = "/api/torrent-file-get?hash=" + hash + "&id=" + file_id;
	this.req(req, onFinished);
};

}

	
var infinityStr = "&#8734;";

/* Format eta string the way uTorrent does */
function formatEtaUt(seconds) {
	function fmt2Nums(n1, n1_name, n2, n2_name) {
		var txt = n1.toFixed(0) + n1_name;
		if (0 != n2) txt += " " + n2.toFixed(0) + n2_name;
		return txt;
	};
	if (seconds == Number.POSITIVE_INFINITY) return infinityStr;
	if (seconds < 0 || seconds >= 3600*24*70) return infinityStr;
	if (seconds < 60) return seconds.toFixed(0) + " s";
	if (seconds < 60*60) {
		var minutes = seconds / 60;
		seconds = seconds % 60;
		return fmt2Nums(minutes, "m", seconds, "s");
	}
	if (seconds < 60*60*24) {
		var minutes = (seconds + 30) / 60;
		var hours = minutes / 60;
		minutes = minutes % 60;
		return fmt2Nums(hours, "h", minutes, "m");
	}
	if (seconds < 60*60*24*7) {
		var hours = (seconds + 30*60) / (60*60);
		var days = hours / 24;
		hours = hours % 24;
		return fmt2Nums(days, "d", hours, "h");
	}
	var days = (seconds + 30*60*24) / (60*60*24);
	var weeks = days / 7;
	days = days % 7;
	return fmt2Nums(weeks, "w", days, "d");
}

function torrentStatus(torrent) {
	if (torrent.stopped)
		return "Stopped";
	var state = torrent.state;
	var state_to_name_map = ["queued_for_checking", "Queued", 
		"checking_files", "Checking",
		"connecting_to_tracker", "Connecting", 
		"downloading", "Downloading",
		"finished", "Finished", 
		"seeding", "Seeding", 
		"allocating", "Allocating"];
	for (var i = 0; i < state_to_name_map.length / 2; i++) {
		if (state == state_to_name_map[i*2])
			return state_to_name_map[i*2+1];
	}
	return "Unknown";
}

function torrentIsSeed(torrent) { return torrent.state == "seeding"; }

function torrentDonePercentF(torrent) {
	return parseFloat(torrent.done) * 100.0 / parseFloat(torrent.size);
}

function torrentDonePercent(torrent) {
	return toFixedNoZeros(torrentDonePercentF(torrent), 2) + "%";
}

function torrentAvail(torrent) {
	var avail = parseFloat(torrent.distributed_copies);
	/* When seeding, this is -1 but we don't want to display -1 to the user so we'll
	   display 1 (another option would be "n/a" */
	if (-1 == avail) avail = 1;
	return toFixedNoZeros(avail,3);
}

function torrentEtaSecs(torrent) {
	var dl_rate = torrent.dl_rate;
	if (0 == dl_rate) return Number.POSITIVE_INFINITY;
	var size = parseFloat(torrent.size);
	var done = parseFloat(torrent.done);
	var remain = size - done;
	return remain / dl_rate;
}

function torrentEta(torrent) { 
	if (torrentCompleted(torrent)) return "";
	return formatEtaUt(torrentEtaSecs(torrent)); 
}

function torrentRemaining(torrent) {
	var remaining = parseFloat(torrent.size) - parseFloat(torrent.done);
	return ppSize(remaining);
}

function torrentRatio(torrent) {
	var downloaded = parseFloat(torrent.done);
	var uploaded = parseFloat(torrent.payload_upload);
	if (0 == uploaded) return "0";
	if (0 == downloaded) return infinityStr;
	var ratio =  uploaded / downloaded;
	return toFixedNoZeros(ratio, 3);
}

function torrentUploaded(torrent) { return ppSize(parseFloat(torrent.payload_upload)); }
/* Note: it uses torrent.done instead of torrent.payload_download because 
   payload_download is counted only during session, so done better matches 
   what users expect */
function torrentDownloaded(torrent) { return ppSize(parseFloat(torrent.done)); }

function toFixedNoZeros(num, precision) {
	var txt = num.toFixed(precision);
	var toRemove = 0;
	var lastPos = txt.length - 1;
	while (toRemove < precision && '0' == txt.charAt(lastPos)) {
		++toRemove;
		--lastPos;
	}
	if (toRemove == precision && '.' == txt.charAt(lastPos)) {
		++toRemove;
	}
	if (toRemove > 0) {
		txt = txt.substr(0, txt.length - toRemove);
	}
	return txt;
}

/* Pretty-print size of 'sizeBytes' bytes to a human-readable size */
function ppSize(sizeBytes, precision, sfx) {
	if (precision == null) precision = 1;
	if (sfx == null) sfx = ["bytes","KB","MB","GB","TB","PB"];
	var idx = 0;
	while (sizeBytes >= 1024) {
		sizeBytes /= 1024;
		idx++;
	}
	return toFixedNoZeros(sizeBytes, precision) + " " + sfx[idx];
}

/* Pretty-print download rate */
function ppRate(num) {
	if (0 == num) return num;
	return ppSize(parseInt(num, 10), 1, ["b","KB","MB","GB","TB","PB"]) + "/s";
}

function calcTotalDlUlRate(torrents) {
	var total_dl_rate = 0;
	var total_ul_rate = 0;
	for (var i = 0; i < torrents.length; i++) {
		var ti = torrents[i];
		total_dl_rate += ti.dl_rate;
		total_ul_rate += ti.ul_rate;
	}
	return [total_dl_rate, total_ul_rate];
}

function failedRequest(request) {
	var status = 0;
	try {  status = request.status; } catch (error) {}
	return status != 200;
}

/* Given a xmlhttprequest object with response to /api/get-torrents
   request in json format, converts it to corresponding javascript
   object (an array of objects describing a torrent) */
function torrentsFromRequest(request) {
	var rsp = request.responseText;
	var json = evalJson(rsp);
	return json.torrents;
}

function torrentCompleted(torrent) { return torrent.done == torrent.size; }