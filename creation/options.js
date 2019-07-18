// Saves options to chrome.storage
function save_options() {
  var hostname = document.getElementById('config.hostname').value;  
  var username = document.getElementById('config.username').value;
    var password = document.getElementById('config.password').value;
    chrome.storage.local.set({
      config: {hostname: hostname, username: username, password: password}
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get([
      "config"]
    , function(items) {
      document.getElementById('config.hostname').value = items.config.hostname;
      document.getElementById('config.username').value = items.config.username;
      document.getElementById('config.password').value = items.config.password;
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);