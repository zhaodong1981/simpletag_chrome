'use strict';
var mainApp = angular.module("mainApp", []);

const CACHE_LIFE_LIMIT = 15; //cached bookmarks valid for 15 mins. 

var token ='';
var SERVER_HOSTNAME = '';

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
  $scope.bookmarks = [];
  $scope.tags ='';

  var forceUpdateButton = document.getElementById('forceupdate');
  disableControls();
 
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
  chrome.storage.local.get(['token','config'], function(result) {
    
    if(!result.config || !result.config.hostname){
      alert("Server not set. Please set in options.");
      window.close();
      return;
    }
    SERVER_HOSTNAME = result.config.hostname;
    if (result.token){
      token = result.token;
 //     showStatus('',0);
      showHideBookmarks(); 
    } else if(result.config.username && result.config.password){
  //    alert("Need to login usernama="+result.config.username + ",pass=" + result.config.password + ",server=" + result.config.hostname);
      login(result.config.username,result.config.password).then((result) => {
        token = result.token;
     //   showStatus('',0);
        showHideBookmarks();
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
    enableControls();
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
 });
}
function showHideBookmarks(){
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
       // alert("test");
        if(typeof bookmarks === 'undefined' || bookmarks.constructor !== Array){
          showStatus('No bookmarks',0);
          enableControls();
          alert("test");
          return;
        }
     
        //document.getElementById('showorhide').innerHTML = 'Hide Bookmarks';
        clearBookmarkTable();
        enableControls();
//        showHideButton.innerHTML='<i class="far fa-eye-slash"></i> Hide Bookmarks';
        showBookmarks(bookmarks);        
      } else{
        forceUpdate(showBookmarks);
    //    enableControls();
      }
      enableControls();
    });
  //  enableControls();
}

  function disableControls(){
      forceUpdateButton.disabled = true;
  }

  function enableControls(){
      forceUpdateButton.disabled = false;
  }

  forceUpdateButton.onclick = function (){
    disableControls();
      forceUpdate(function(bookmarks){//bookmark table visible, refresh it
        clearBookmarkTable();
        showBookmarks(bookmarks);
        enableControls();
      });
    
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
});
