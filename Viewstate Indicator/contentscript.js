var viewState = document.getElementById('__VIEWSTATE');
if (viewState != null) {
	var size = viewState.value.length;
	chrome.extension.sendRequest({ title: 'Page viewstate size is ' + size + ' bytes', viewStateSize: size, viewState: viewState.value }, function (response) { });
}