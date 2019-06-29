'use strict';
var mainApp = angular.module("mainApp", []);
 

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
  $scope.bookmarks = [];
  let token ='';
  $scope.tags ='';
  var existingBookmark;
  chrome.storage.local.get(['token','username','password'], function(result) {
    if (result.token){
      token = result.token;
      showBookmarks(token);
 
    } else if(result.username && result.password){
     // alert("Need to login");
      login(result.username,result.password).then((result) => {
        token = result.token;
        showBookmarks(token)
     }
    
     ).catch(error => {
       alert('login failed' +  JSON.stringify(error));});
    }
  });

  //get URL and title of current tab
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    $scope.page={"title": tabs[0].title, "url": tabs[0].url};

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
      $http.get('https://v.zhaodong.name/api/link',{headers: {'Authorization': 'Bearer ' + token }}).then(function (result) {
    //    $scope.bookmarks =result.data.data;
        const bookmarks = result.data;
        for(const bookmark of bookmarks){
          if($scope.page.url === bookmark.url){
            //$scope.tags = bookmark.tags;
            existingBookmark = bookmark;
            document.getElementById('create').innerHTML = 'Save';
            for(const tag of bookmark.tags){
              $scope.tags +=tag + ',';
            }
            break;
          }
      }
        	// Generate a big table
      for(const bookmark of bookmarks){

        var row1 = "<tr><td>" +  "<a href=\""+bookmark.url + "\" target=\"_blank\" >"+bookmark.title+"</a>" +"</td> <td>";
      
        for (const tag of bookmark.tags){
          row1 += "<a href=\"https://v.zhaodong.name/tag/tag.html#?name="+tag + "\" target=\"_blank\" style=\"margin: 5px\">"+tag+"</a>"
        }

        row1+="</td></tr>";
        $("#bookmarkTable").append(row1);
            
      }
          // And a simple one
          

          // And make them fancy
      $("#bookmarkTable").fancyTable({
 //       sortColumn:0,
        pagination: true,
        perPage:10,
        globalSearch:true
      });
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
   let closeBtn = document.getElementById('close');
   closeBtn.onclick = function() {
      window.close();
   };
/*
   let searchBtn = document.getElementById('search');
   searchBtn.onclick = function() {
    search();
   };
   let keywordInput = document.getElementById('keywords');
   keywordInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        search();
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
    if (token === ''){
      alert('Not login');
      return;
    }
    
   // alert('Not login');
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
  
     $http.put('https://v.zhaodong.name/api/link/'+existingBookmark.id,
     body,
      {   
          method: 'PUT',
          headers: headers
        }
      ).then(function() {
        console.log("bookmark updated");
        window.close();
      }).catch(error => {
        console.error('Error during updating bookmark:', error);
        alert("bookmark created failed " + JSON.stringify(error));
     });
   } else {
 //    alert("new bookmark");
     $http.post('https://v.zhaodong.name/api/link/create',
      body,
      {
          method: 'POST',
          headers: headers
        }
      ).then(function() {
        console.log("bookmark created");
        window.close();
      }).catch(error => {
        console.error('Error during create bookmark:', error);
        alert("bookmark created failed " + JSON.stringify(error));
     });
     //window.close();
   }
    
 }
});
