'use strict';
         var mainApp = angular.module("mainApp", []);
         
         mainApp.controller('bookmarkController', function($scope, $http) {
            $scope.bookmarks = [];
           $http.get('https://v.zhaodong.name/api/link').then(function (result) {
            
            $scope.bookmarks =result.data;
           });
         });