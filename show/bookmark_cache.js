//pull bookmarks periodically.

chrome.alarms.create({periodInMinutes: 10});

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
   //pull all bookmarks
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

    //pull all tags
    fetch('https://v.zhaodong.name/api/tag',
    {headers: {'Authorization': 'Bearer ' + token }})
    .then(res => res.json()).then(result => {
  //  alert("bookmakrs="+JSON.stringify(result.data));    
        const tags = result;
       // alert("tags="+JSON.stringify(tags));
        chrome.storage.local.set({
            tags_data: tags
        }, function() {
         //   alert("bookmark updated");
        });
    });
}