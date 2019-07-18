'use strict';
var mainApp = angular.module("mainApp", []);

var token ='';
var SERVER_HOSTNAME = '';

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
  $scope.bookmarks = [];
  $scope.tags ='';
  var existingBookmark;
  var tagsInput = document.getElementById('tags');
  var titleInput = document.getElementById('title')
  var saveCreateButton = document.getElementById("create");
   disableControls();
  //get URL and title of current tab
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    $scope.page={"title": tabs[0].title, "url": tabs[0].url};
  
  });

  function showStatus(message,spinner){
 /*   var status = document.getElementById('status');
    status.textContent = message;
    if(spinner===1){
      $("#spinner_status").show();
    }else{
      $("#spinner_status").hide();
    }
  */
  }
  function clearStatus(){
 //   var status = document.getElementById('status');
  //  status.textContent = '';
 //   $("#spinner_status").hide();
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

function addToLocal(bookmark,update){
   
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
      
    fetch('https://v.zhaodong.name/api/tag',
      {headers: {'Authorization': 'Bearer ' + token }})
      .then(res => res.json()).then(result => {
        const tags = result;
        let tags1 = tags.map(a => a.tag);
        autocomplete(document.getElementById("tags"), tags1);
 });
    
  };


  function disableControls(){
      saveCreateButton.disabled = true;
      tagsInput.disabled = true;
      titleInput.disabled = true;
  }

  function enableControls(disable){
      saveCreateButton.disabled = false;
      tagsInput.disabled = false;
      titleInput.disabled = false;
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
        window.close();
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
        window.close();
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
