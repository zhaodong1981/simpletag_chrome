'use strict';
function formatTags(oldtags){
  let tempTags = [];
  if(typeof oldtags !== 'undefined' && oldtags && oldtags.constructor === Array){
    tempTags = oldtags;
  } else if (typeof oldtags === 'string'){
    tempTags = oldtags.split(',');
  } 

  let validTags = [];
  for (const tag of tempTags ){
    if (tag !== ''){
      validTags.push(tag);
    }
  }
  return validTags;
}

let createBtn = document.getElementById('create');

createBtn.onclick = function() {
  console.log("create a bookmark")
 /* $.ajax({
        url: "https://v.zhaodong.name/api/link/"
  }).then(function(data) {
    console.log(data);
    $('#editdialog').html(data[0].id+', '+ data[0].title);
  });
*/
//alert("creating a bookmark");
let tagsInput = document.getElementById('tags');
let tags = formatTags (tagsInput.value);
alert( "tags=" + tags);
var url = "";
var title = "";
chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  url = tabs[0].url;
  title = tabs[0].title
  alert("url="+url + ", title = "+title + ",tags="+ tags);

fetch('https://v.zhaodong.name/api/link/create', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    'title': title,
    'url': url,
    'description': "test description",
    'tags': tags          
  })
}
).then(function(data) {
  console.log(data);
  $('#response').html(data);
}).catch(error => {
  console.error('Error during create bookmark:', error);
  alert(error);
});
});


};