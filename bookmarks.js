'use strict';
var mainApp = angular.module("mainApp", []);

const CACHE_LIFE_LIMIT = 15; //cached bookmarks valid for 15 mins. 

var token ='';
var bookmarktable_visible = 0;
var SERVER_HOSTNAME = '';

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
  $scope.bookmarks = [];
  $scope.tags ='';
  var existingBookmark;
  var tagsInput = document.getElementById('tags');
  var titleInput = document.getElementById('title')
  var saveCreateButton = document.getElementById("create");
  var showHideButton = document.getElementById("showorhide");
  var forceUpdateButton = document.getElementById('forceupdate');
  disableControls();
  //get URL and title of current tab
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    $scope.page={"title": tabs[0].title, "url": tabs[0].url};
  
  });

  function showStatus(message,spinner){
    var status = document.getElementById('status');
    status.textContent = message;
    if(spinner===1){
      $("#spinner_status").show();
    }else{
      $("#spinner_status").hide();
    }
  }
  function clearStatus(){
    var status = document.getElementById('status');
    status.textContent = '';
    $("#spinner_status").hide();
  }
/*
  function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get([
      "config"]
    , function(items) {
      document.getElementById('config.hostname').value = items.config.hostname;
      document.getElementById('config.username').value = items.config.username;
      document.getElementById('config.password').value = items.config.password;
    });
  }
*/
  chrome.storage.local.get(['token','config'], function(result) {
    
    if(!result.config || !result.config.hostname){
      alert("Server not set. Please set in options.");
      window.close();
      return;
    }
    SERVER_HOSTNAME = result.config.hostname;
    if (result.token){
      token = result.token;
      prepare4Creation();
    } else if(result.config.username && result.config.password){
  //    alert("Need to login usernama="+result.config.username + ",pass=" + result.config.password + ",server=" + result.config.hostname);
      login(result.config.username,result.config.password).then((result) => {
        token = result.token;
        prepare4Creation();
     }
    
     ).catch(error => {
       alert('login failed' +  JSON.stringify(error));});
    } else{
      alert('Username or password not set. Please set them in the options page.');
    }
  });
 // alert("https://v.zhaodong.name= " + SERVER_HOSTNAME);
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
function clearBookmarkTable(){
  $("#bookmarkTable tbody").empty(); // clear all rows
  $("#bookmarkTable tfoot").empty();
  if($("#bookmark_table_head tr").length > 1){ // the search box added last time
    $("#bookmark_table_head tr:last-child").remove();
  }
}

function showBookmarks(bookmarks){
  var html = [];
   for(const bookmark of bookmarks){

    var row1 = "<tr><td>" +  "<a href=\""+bookmark.url + "\" target=\"_blank\" >"+bookmark.title+"</a>" +"</td> <td>";
    if(bookmark.tags && bookmark.tags.constructor === Array){
      for (const tag of bookmark.tags){
        row1 += "<a href=\"https://v.zhaodong.name/tag/tag.html#?name="+tag + "\" target=\"_blank\" style=\"margin: 5px\">"+tag+"</a>"
      }
    }
   

    row1+="</td></tr>";
    html.push(row1);        
  }
 // alert(JSON.stringify(html));
  $("#bookmarkTable tbody").append(html.join(''));
  
  // And make them fancy    
  $("#bookmarkTable").fancyTable({
//       sortColumn:0,
    pagination: true,
    perPage:10,
    globalSearch:true
  });

  bookmarktable_visible = 1;
  showHideButton.innerHTML='<i class="far fa-eye-slash"></i> Hide Bookmarks';
  $("#bookmarkTable").show();
}

function forceUpdate(bookmarkCallback){
  showStatus('Loading bookmarks from server ...', 1);
  $http.get('https://v.zhaodong.name/api/link',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
     clearStatus();
   //    $scope.bookmarks =result.data.data;
     const bookmarks = result.data;

     chrome.storage.local.set({
       bookmark_data: {bookmarks:bookmarks, updated: Date.now()}
     }, function() {
       
     });

    showStatus('Bookmarks loaded from server: ' + bookmarks.length,0);
     if(bookmarkCallback){
      bookmarkCallback(bookmarks);
     }
    
     //status.textContent = 'Done';
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
function showHideBookmarks(){
  if(bookmarktable_visible === 1){
    //document.getElementById('showorhide').innerHTML = 'Show Bookmarks';
    bookmarktable_visible = 0;
    showHideButton.innerHTML = '<i class="far fa-eye-slash"></i> Show Bookmarks';
    clearBookmarkTable();
    $("#bookmarkTable").hide();
    clearStatus();
    return;
  }
  disableControls();
  showStatus("Loading bookmarks from cache ", 1);
  chrome.storage.local.get(['bookmark_data'], function(result) {
    //  alert("local storage " + JSON.stringify(result));
   
      var elapsed = CACHE_LIFE_LIMIT + 1;
      if (result.bookmark_data &&  result.bookmark_data.updated){
        elapsed = Math.floor((Date.now() - result.bookmark_data.updated)/1000/60);
      }
      if (elapsed <= CACHE_LIFE_LIMIT){
        showStatus("Bookmarks loaded. Updated " + elapsed + " mins ago",0);
        var bookmarks = result.bookmark_data.bookmarks;
      
        if(typeof bookmarks === 'undefined' || bookmarks.constructor !== Array){
          showStatus('No bookmarks',0);
          enableControls();
          return;
        }
        //document.getElementById('showorhide').innerHTML = 'Hide Bookmarks';
        clearBookmarkTable();
//        bookmarktable_visible = 1;
//        showHideButton.innerHTML='<i class="far fa-eye-slash"></i> Hide Bookmarks';
        showBookmarks(bookmarks);
//        $("#bookmarkTable").show();
        
      } else{
        forceUpdate(showBookmarks);
      }
      enableControls();
    });
}

function addToLocal(bookmark,update){
   
    chrome.storage.local.get(['bookmark_data'], function(result) {
      //  alert("local storage " + JSON.stringify(result));
        var bookmarks = [];
       

        if (result.bookmark_data){
          bookmarks = result.bookmark_data.bookmarks;
          if(update){//Updating existing bookmark length
          //  alert("Updating existing bookmark length=" + bookmarks.length);
            var i,j;
            for(i=0,j=bookmarks.length; i<j; i++){
             //   alert("bookmarks[i].url=" + bookmarks[i].url);
                if (bookmarks[i].url === bookmark.url){
              //    alert("Existing bookmark found");
                  bookmark.id = bookmarks[i].id;
                  bookmarks.splice(i, 1);
                  break;
                }
            }
          }
        } 
        bookmarks.unshift(bookmark);
      
        chrome.storage.local.set({
          bookmark_data: {bookmarks:bookmarks, updated: Date.now()}
        }, function() {
          
        });
      });
}
function prepare4Creation () {

 // var tags = ['xyz','123','yyy'];
//check if the URL exists
  showStatus('Checking if bookmark exists ...',1);
      $http.get('https://v.zhaodong.name/api/link/search?url=' + encodeURIComponent($scope.page.url),{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
     //   $scope.message = 'Loading bookmark count done';
        if(result.data.length >0){
            //exists
          existingBookmark = result.data[0];
          saveCreateButton.innerHTML = '<i class="fas fa-save"></i></i> Save';
          
          for(const tag of existingBookmark.tags){
             $scope.tags +=tag + ',';
          }

        }
        enableControls();
        showStatus('',0);
      }).catch(function (error){
        alert("Failed to check existence of a bookmark with the same URL: " + error);
        enableControls();
      });
      
      chrome.storage.local.get(['tags_data'], function(result) {
        if (result.tags_data){
          //tags found
          let tags = result.tags_data.map(a => a.tag);
      //    alert(tags);
          autocomplete(tagsInput, tags);
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
        $http.get('https://v.zhaodong.name/api/link?limit=100',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
          $scope.bookmarks =result.data;
       });
      }
  }
  function disableControls(){
      forceUpdateButton.disabled = true;
      saveCreateButton.disabled = true;
      showHideButton.disabled = true;
      tagsInput.disabled = true;
      titleInput.disabled = true;
  }

  function enableControls(disable){
      forceUpdateButton.disabled = false;
      saveCreateButton.disabled = false;
      showHideButton.disabled = false;
      tagsInput.disabled = false;
      titleInput.disabled = false;
  }
//  let showHideButton = document.getElementById('showorhide');
  showHideButton.onclick = function (){
    showHideBookmarks();
  }
  
  forceUpdateButton.onclick = function (){
    disableControls();
    if(bookmarktable_visible === 1){
      forceUpdate(function(bookmarks){//bookmark table visible, refresh it
        clearBookmarkTable();
        showBookmarks(bookmarks);
        enableControls();
      });
    }else{//bookmark table not visible, only refresh cache
      forceUpdate(function(){
        enableControls();
      });
    }
    
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
    var status = document.getElementById('status')
    //status.textContent = 'Waiting';
    showStatus('Waiting', 1);
    disableControls();
  
    let tags = formatTags (tagsInput.value);
    var url = document.getElementById('url').value;
    var title = titleInput.value;
    var bookmark = {
      'title': title,
      'url': url,
      'description': existingBookmark ? existingBookmark.description : 'Bookmark created via chrome extension',
      'tags': tags          
    };
    var body =    JSON.stringify(bookmark);

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
        showStatus("Bookmark updated", 0);
        enableControls();
        addToLocal(bookmark,1);
      //  window.close();
      }).catch(error => {
        console.error('Error during updating bookmark:', error);
        alert("bookmark udpated failed " + JSON.stringify(error));
        showStatus("Failed to update bookmark: " + JSON.stringify(error),0);
        enableControls();
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
        showStatus("Bookmark created", 0);
        enableControls();
        addToLocal(bookmark);
        saveCreateButton.innerHTML = '<i class="fas fa-save"></i></i> Save';
    //    window.close();
      }).catch(error => {
        console.error('Error during create bookmark:', error);
        alert("bookmark created failed " + JSON.stringify(error));
        showStatus("Failed to create bookmark: " + JSON.stringify(error), 0);
        enableControls();
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
      if (tag !== '' && validTags.indexOf(tag) === -1){
        validTags.push(tag);
      }
    }
    return validTags;
  }
  
  
  saveCreateButton.onclick = function() {
    saveCreate();
  }
});
