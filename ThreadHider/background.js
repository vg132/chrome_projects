var contextMenuCreated = false;
var urlRegExp = new RegExp('^(http|https)://forums\.autosport\.com/forum/(.*)/','i');

function isActive(tabId, changeInfo, tab) {
	if (urlRegExp.test(tab.url)) {
		chrome.pageAction.show(tabId);
		injectScript();
	} else {
		chrome.contextMenus.removeAll();
		contextMenuCreated = false;
	}
};

function injectScript(){
	chrome.storage.sync.get('hidden_urls',function(value){
		var urls = value['hidden_urls'] || [];
		var urlString = '';
		if(urls.length>0) {
			for(var i=0;i<urls.length;i++){
				urlString+="'" + urls[i]+"',";
			}
			urlString = '[' + urlString.substring(0, urlString.length - 1) + '];';
		} else {
			urlString = '[];'
		}
		chrome.tabs.executeScript(null, { code:"var urls = " + urlString }, function() {
			chrome.tabs.executeScript(null, { file: "content.js" });
		});
	});
}

function createContextMenu() {
	if(!contextMenuCreated) {
		chrome.contextMenus.create({
			'title' : 'Hide thread',
			'contexts':['link'],
			'onclick': function (info, tab) {
				saveChanges(info.linkUrl);
			}
		});
		contextMenuCreated = true;
	}
}

function saveChanges(url) {
	if(url!=null && url.trim()!='') {
		chrome.storage.sync.get('hidden_urls',function(value) {
			var urls = value['hidden_urls'] || [];
			if(urls.indexOf(url)<0)	{
				urls.push(url);
				chrome.storage.sync.set({'hidden_urls': urls}, function() {
					injectScript();
				});
			}
		});
	}
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == 'updateContextMenu') {
		if (request.show) {
			createContextMenu();
		} else {
			chrome.contextMenus.removeAll();
			contextMenuCreated = false;
		}
	} else {
		sendResponse({});
	}
});

chrome.tabs.onUpdated.addListener(isActive);