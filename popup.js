'use strict';

let getdata = document.getElementById('getdata');

getdata.onclick = function() {
  console.log("btn get data")
  $.ajax({
        url: "http://zhaodong.usersys.redhat.com:3000/api/car/1"
  }).then(function(data) {
    console.log(data);
    $('#editdialog').html(data.id+', '+ data.maker+', '+ data.model+', '+ data.driver + ', ' + data.year);
  });

};