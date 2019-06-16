'use strict';
         var mainApp = angular.module("mainApp", []);
         
         mainApp.controller('bookmarkController', function($scope) {
           /* $scope.student = {
               firstName: "Mahesh",
               lastName: "Parashar",
               fees:500,
               
               subjects:[
                  {name:'Physics',marks:70},
                  {name:'Chemistry',marks:80},
                  {name:'Math',marks:65},
                  {name:'English',marks:75},
                  {name:'Hindi',marks:67}
               ],
               fullName: function() {
                  var studentObject;
                  studentObject = $scope.student;
                  return studentObject.firstName + " " + studentObject.lastName;
               }
            };
            */
       
            fetch('https://v.zhaodong.name/api/link').then(res => res.json())
            .then((data) => {
            //  alert(data);
              $scope.bookmarks = data;
            }).catch(error => {
              console.error('Error during refresh bookmark:', error);
            });
         });