var linkTextRegExp = new RegExp('/(\\d*)-(.*)/$','i');

var ath = {
	listHiddenThreads: function() {
		chrome.storage.sync.get('hidden_urls',function(value){
			var urls = value['hidden_urls'] || [];
			if(urls.length == 0){
				var container = document.createElement('div');
				container.appendChild(document.createTextNode("No blocked threads!"));
				document.body.appendChild(container);
			} else {
				for(var i = 0; i<urls.length;i++){
					var container = document.createElement('div');
					document.body.appendChild(container);
					var removeIcon = document.createElement('img');
					removeIcon.src='remove.png';
					removeIcon.addEventListener('click', function(e) {
						ath.removeUrl(e.target.nextSibling.attributes['href'].value);
						document.body.removeChild(e.target.parentNode);
					});
					container.appendChild(removeIcon);
					var link = document.createElement('a');
					var urlParts = linkTextRegExp.exec(urls[i]);
					if(urlParts!=null && urlParts.length>2) {
						link.appendChild(document.createTextNode(ath.capitaliseFirstLetter(urlParts[2].replace(/-/g, ' '))));
					} else {
						link.appendChild(document.createTextNode(urls[i]));
					}
					link.href = urls[i];
					link.target='_blank';
					container.appendChild(link);
					container.appendChild(document.createElement('br'));
				}

				var container = document.createElement('div');
				document.body.appendChild(container);
				var removeIcon = document.createElement('img');
				removeIcon.src='remove.png';
				removeIcon.addEventListener('click', function(e) {
					ath.removeAll();
					document.body.removeChild(e.target.parentNode);
				});
				container.appendChild(removeIcon);
				container.appendChild(document.createTextNode("Remove all"));
				container.appendChild(document.createElement('br'));
			}
		});
	},

	removeAll: function() {
		chrome.storage.sync.clear();
	},

	removeUrl: function(url){
		chrome.storage.sync.get('hidden_urls',function(value) {
			var urls = value['hidden_urls'] || [];
			if(urls.indexOf(url)>-1)	{
				urls.splice(urls.indexOf(url), 1);
				chrome.storage.sync.set({'hidden_urls': urls});
			}
		});
	},

	capitaliseFirstLetter: function(string) {
		if(string!=null && string.length>1) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}
		return string;
	}
};

document.addEventListener('DOMContentLoaded', function () {
  ath.listHiddenThreads();
});