function downloadUrl()
{
	var url = document.querySelector('#downloadUrl').value;
	chrome.downloads.download({
		url: url,
	});
	window.close();
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('downloadUrlButton').addEventListener('click', downloadUrl);
});