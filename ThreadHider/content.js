var linkTextRegExp = new RegExp('^(http|https)://forums.autosport.com/topic/(\\d*)-(.*)/$','i');

for(var i=0;i<urls.length;i++){
	var links = document.querySelectorAll('[href="' + urls[i] + '"]');
	for(var ii=0;ii<links.length;ii++) {
		if(links[ii].getAttribute('class')=='topic_title'){
			var container = links[ii].parentNode.parentNode.parentNode;
			container.parentNode.removeChild(container);
		}
	}
}

document.addEventListener("mousedown", function(event) {
	if (event.button !== 2) {
		return false;
	}
	var showMenu = false;
	if(event.target!=null) {
		var link = event.target.parentNode;
		if(link != null && linkTextRegExp.test(link.getAttribute('href'))) {
			showMenu = true;
		}
	}
	chrome.extension.sendMessage({'message': 'updateContextMenu', 'show': showMenu});
}, true);