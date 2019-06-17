'use strict';
var mainApp = angular.module("mainApp", []);
 

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
   $scope.bookmarks = [];
   $http.get('https://v.zhaodong.name/api/link').then(function (result) {
      $scope.bookmarks =result.data;
   });
   var url = "";
   var title = "";
   chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
     url = tabs[0].url;
     title = tabs[0].title
     $scope.page={"title": title, "url": url};
     console.log(page);
   });
   
   let refreshBtn = document.getElementById('refresh');
   refreshBtn.onclick = function() {
      $http.get('https://v.zhaodong.name/api/link').then(function (result) {
         $scope.bookmarks =result.data;
   });
   };
   let cancelBtn = document.getElementById('cancel');
   cancelBtn.onclick = function() {
      window.close();
   };

   let searchBtn = document.getElementById('search');
   searchBtn.onclick = function() {
      var keywords = document.getElementById('keywords').value;
      alert("Search " +keywords);
   };
});
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
       console.log("bookmark created");
     }).catch(error => {
       console.error('Error during create bookmark:', error);
       });
   });
}

