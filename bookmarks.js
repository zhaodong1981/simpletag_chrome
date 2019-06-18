'use strict';
var mainApp = angular.module("mainApp", []);
 

//display existing tags
mainApp.controller('bookmarkController', function($scope, $http) {
   $scope.bookmarks = [];
   //only get the recently modified 50 bookmakrs
   $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1').then(function (result) {
      $scope.bookmarks =result.data.data;
   });
   var url = "";
   var title = "";
   chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
     url = tabs[0].url;
     title = tabs[0].title
     $scope.page={"title": title, "url": url};
  
   });
   
   let refreshBtn = document.getElementById('refresh');
   refreshBtn.onclick = function() {
      $http.get('https://v.zhaodong.name/api/link?per_page=50&page=1').then(function (result) {
         $scope.bookmarks =result.data.data;
      });
   };
   let cancelBtn = document.getElementById('cancel');
   cancelBtn.onclick = function() {
      window.close();
   };

   let searchBtn = document.getElementById('search');
   searchBtn.onclick = function() {
      var keywords = document.getElementById('keywords').value;
      if(typeof keywords != 'undefined' && keywords != '' && keywords != null ){
        
          $http.get('https://v.zhaodong.name/api/link/search?q=' + keywords).then(function (result) {
          $scope.bookmarks =result.data;
       });
      }
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

