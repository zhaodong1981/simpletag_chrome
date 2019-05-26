'use strict';

let getdata = document.getElementById('getdata');

onclick = function(element) {
  console.log("btn get data")
  $.ajax({
        url: "http://localhost:3000/api/car/5"
  }).then(function(data) {
    console.log(data);
    $('#editdialog').html(data.id+', '+ data.maker+', '+ data.model+', '+ data.driver + ', ' + data.year);
  });

};