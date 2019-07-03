'use strict';
var mainApp = angular.module("mainApp", []);

const CACHE_LIFE_LIMIT = 15; //cached bookmarks valid for 15 mins. 

var token ='';

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
  $scope.bookmarks = [];
  
  $scope.tags ='';
  var existingBookmark;
  var saveCreateButton = document.getElementById("create");
  saveCreateButton.disabled = true;
  //get URL and title of current tab
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    $scope.page={"title": tabs[0].title, "url": tabs[0].url};
  
  });

  chrome.storage.local.get(['token','username','password'], function(result) {
    if (result.token){
      token = result.token;
      prepare4Creation();
   //   loadAndShowBookmarks();
 
    } else if(result.username && result.password){
     // alert("Need to login");
      login(result.username,result.password).then((result) => {
        token = result.token;
        prepare4Creation();
//      loadAndShowBookmarks();
     }
    
     ).catch(error => {
       alert('login failed' +  JSON.stringify(error));});
    } else{
      alert('Username or password not set. Please set them in the options page.');
    }
  });

  function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                console.log("login failed")
              // alert("Login failed");
        //        location.reload(true);
            }
            return Promise.reject(error);
        }

        return data;
    });
}
  function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    };

    return fetch('https://v.zhaodong.name/api/user/authenticate', requestOptions)
        .then(handleResponse)
        .then(user => {
          chrome.storage.local.set({"token": user.token}, function() {
            //alert('Settings saved');
           });
            return user;
        });
};
async function showBookmarks(bookmarks){
  if(typeof bookmarks === 'undefined' || bookmarks.constructor !== Array){
    $scope.message = 'No bookmarks';
    return;
  }
  if(document.getElementById('loadandshow').innerHTML === 'Show Bookmarks'){
    document.getElementById('loadandshow').innerHTML = 'Hide Bookmarks';
    $("#bookmarkTable").show();
  } else{
    document.getElementById('loadandshow').innerHTML = 'Show Bookmarks';
    $("#bookmarkTable").hide();
    return;
  }
  
  //   alert("Time elapsed: " + new Date() - start);
  $("#bookmarkTable tboby").empty(); // clear all rows
  if($("#bookmark_table_head tr").length > 1){ // the search box added last time
    $("#bookmark_table_head tr:last-child").remove();
  }
  var html = [];
   for(const bookmark of bookmarks){

    var row1 = "<tr><td>" +  "<a href=\""+bookmark.url + "\" target=\"_blank\" >"+bookmark.title+"</a>" +"</td> <td>";
  
    for (const tag of bookmark.tags){
      row1 += "<a href=\"https://v.zhaodong.name/tag/tag.html#?name="+tag + "\" target=\"_blank\" style=\"margin: 5px\">"+tag+"</a>"
    }

    row1+="</td></tr>";
    html.push(row1);        
  }
  $("#bookmarkTable > tbody:last-child").append(html.join(''));
      // And make them fancy
      
  $("#bookmarkTable").fancyTable({
//       sortColumn:0,
    pagination: true,
    perPage:10,
    globalSearch:true
  });
  
}
function loadAndShowBookmarks(){
  chrome.storage.local.get(['bookmark_data'], function(result) {
    //  alert("local storage " + JSON.stringify(result));
   
      var elapsed = CACHE_LIFE_LIMIT + 1;
      if (result.bookmark_data &&  result.bookmark_data.updated){
        elapsed = Math.floor((Date.now() - result.bookmark_data.updated)/1000/60);
      }

      if (elapsed <= CACHE_LIFE_LIMIT){
        $scope.message = "Bookmarks loaded. Updated " + elapsed + " mins ago";
        showBookmarks(result.bookmark_data.bookmarks);
      } else{
        $scope.message = 'Loading bookmarks';
        $http.get('https://v.zhaodong.name/api/link',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
          $scope.message = 'Loading bookmark done';
        //    $scope.bookmarks =result.data.data;
          const bookmarks = result.data;

          chrome.storage.local.set({
            bookmark_data: {bookmarks:bookmarks, updated: Date.now()}
          }, function() {
            
          });

        $scope.message = 'Bookmarks loaded from server: ' + bookmarks.length;
        showBookmarks(bookmarks);
  
        $scope.message = 'Done';
      }).catch({
        // alert("load bookmark failed");
      });

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
          let tags1 = tags.map(a => a.tag);
          autocomplete(document.getElementById("tags"), tags1);
      });

      }
    });
}
function prepare4Creation () {

 // var tags = ['xyz','123','yyy'];
//check if the URL exists
      $http.get('https://v.zhaodong.name/api/link/search?url=' + encodeURIComponent($scope.page.url),{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
     //   $scope.message = 'Loading bookmark count done';
        if(result.data.length >0){
            //exists
          existingBookmark = result.data[0];
          document.getElementById('create').innerHTML = 'Save';
          
          for(const tag of existingBookmark.tags){
             $scope.tags +=tag + ',';
          }

        }
        saveCreateButton.disabled = false;
      });
      chrome.storage.local.get(['tags_data'], function(result) {
        if (result.tags_data){
          //tags found
          let tags = result.tags_data.map(a => a.tag);
      //    alert(tags);
          autocomplete(document.getElementById("tags"), tags);
        }
      });
    
  };

  function search () {
    if (token === ''){
      alert('Not login');
      return;
    }
      var keywords = document.getElementById('keywords').value;
      if(typeof keywords != 'undefined' && keywords != '' && keywords != null ){
          keywords = encodeURIComponent(keywords);
          $http.get('https://v.zhaodong.name/api/link/search?q=' + keywords,{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
          $scope.bookmarks =result.data;
       });
      }else { // show bookmarks
        $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
          $scope.bookmarks =result.data.data;
       });
      }
  }

  let loadAndShowButton = document.getElementById('loadandshow');
  loadAndShowButton.onclick = function (){
    loadAndShowBookmarks();
  }
   let logoutBtn = document.getElementById('logout');
   logoutBtn.onclick = function() {
   /* if (token === ''){
      alert('Not login');
      return;
    }
      $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
         $scope.bookmarks =result.data.data;
      });
    */
   
    chrome.storage.local.remove("token", function() {
      alert('Logging out. Reopen to login again.');
      window.close();
    });
   };

   /*
   let closeBtn = document.getElementById('close');
   closeBtn.onclick = function() {
      window.close();
   };
   */
/*
   let searchBtn = document.getElementById('search');
   searchBtn.onclick = function() {
    search();
   };
*/
   function saveCreate(){
    if (token === ''){
      alert('Not login');
      return;
    }

    $scope.message = 'Waiting';
    saveCreateButton.disabled = true;
  
    let tags = formatTags (document.getElementById('tags').value);
    var url = document.getElementById('url').value;
    var title = document.getElementById('title').value;
    var body =    JSON.stringify({
      'title': title,
      'url': url,
      'description': existingBookmark ? existingBookmark.description : 'Bookmark created via chrome extension',
      'tags': tags          
    });

    var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token 
    };

   if (existingBookmark){
 //    alert("update");
     $http.put('https://v.zhaodong.name/api/link/'+existingBookmark.id,
     body,
      {   
          method: 'PUT',
          headers: headers
        }
      ).then(function() {
        console.log("bookmark updated");
        $scope.message = "bookmark updated";
        window.close();
      }).catch(error => {
        console.error('Error during updating bookmark:', error);
        alert("bookmark udpated failed " + JSON.stringify(error));
        $scope.message = "bookmark update failed " + JSON.stringify(error);
        saveCreateButton.disabled = false;
     });
   } else {
  //   alert("new bookmark");
     $http.post('https://v.zhaodong.name/api/link/create',
      body,
      {
          method: 'POST',
          headers: headers
        }
      ).then(function() {
        console.log("bookmark created");
        $scope.message = "bookmark created";
        window.close();
      }).catch(error => {
        console.error('Error during create bookmark:', error);
        alert("bookmark created failed " + JSON.stringify(error));
        $scope.message = "bookmark created failed " + JSON.stringify(error);
        document.getElementById("create").disabled = false;
     });
     //window.close();
   }
   }
   /*
   let tagsInput = document.getElementById('tags');
   tagsInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        saveCreate();
      }
   });
   */
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
    saveCreate();
  }
});
