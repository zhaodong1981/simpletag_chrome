//pull bookmarks periodically.

chrome.alarms.create({periodInMinutes: 2});

chrome.alarms.onAlarm.addListener(function(alarm) {
   //updating cached bookmarks.
   chrome.storage.local.get(['token'], function(result) {
    if (result.token){
      token = result.token;
      updateCachedBookmarks(token);
    }
});
});

function updateCachedBookmarks(token){ 
   
    fetch('https://v.zhaodong.name/api/link',
    {headers: {'Authorization': 'Bearer ' + token }})
    .then(res => res.json()).then(result => {
  //  alert("bookmakrs="+JSON.stringify(result.data));    
        const bookmarks = result;
     //   alert("bookmakrs="+JSON.stringify(bookmarks));
        chrome.storage.local.set({
            bookmark_data: {bookmarks:bookmarks, updated: Date.now()}
        }, function() {
         //   alert("bookmark updated");
        });
    });
}