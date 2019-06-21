'use strict';
var mainApp = angular.module("mainApp", []);
 

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
   $scope.bookmarks = [];
  let token ='';
  chrome.storage.local.get(['token'], function(result) {
  //  alert('Settings retrieved' + result.token);
    if (result.token){
      token = result.token;
      showBookmarks(token);
 
    } else {
      login("test","test").then((result) => {
        token = result.token;
        showBookmarks(token)
     }
    
     ).catch(error => {
       alert('login failed' +  error);});
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

  function showBookmarks (token) {
      $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
        $scope.bookmarks =result.data.data;
    });
    var url = "";
    var title = "";
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      url = tabs[0].url;
      title = tabs[0].title
      $scope.page={"title": title, "url": url};

    });
  };
   let refreshBtn = document.getElementById('refresh');
   refreshBtn.onclick = function() {
    if (token === ''){
      alert('Not login');
      return;
    }
      $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
         $scope.bookmarks =result.data.data;
      });
   };
   let cancelBtn = document.getElementById('cancel');
   cancelBtn.onclick = function() {
      window.close();
   };

   let searchBtn = document.getElementById('search');
   searchBtn.onclick = function() {
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
      }
   };
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
    if (token === ''){
      alert('Not login');
      return;
    }
   // alert('Not login');
    let tagsInput = document.getElementById('tags');
    let tags = formatTags (tagsInput.value);
    var url = "";
    var title = "";
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      url = tabs[0].url;
      title = tabs[0].title
  
      fetch('https://v.zhaodong.name/api/link/create', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token 
          },
          body: JSON.stringify({
            'title': title,
            'url': url,
            'description': "test description",
            'tags': tags          
          })
        }
      ).then(function(data) {
        console.log("bookmark created");
        alert("bookmark created");
        window.close();
      }).catch(error => {
        console.error('Error during create bookmark:', error);
     //   alert("bookmark created failed " + error);
        });
        window.close();
    });
    
 }
});

