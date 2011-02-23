jQuery(document).ready(function() {

  // Get the extension options and store in torrent sdk object  
  var sdkCtl = new SdkCtl();
  chrome.extension.sendRequest({name: "getOptions"},
   function(response) {
        sdkCtl.nasboxurl = response.nasboxurl;
   });

  jQuery('a[href$="torrent"]').each(function() {
    jQuery(this).click(function(event) {
      // Add clicked torrent file to the BitTorrent web client
      var torrentURL = jQuery(this).attr("href");
      sdkCtl.torrentAddUrl(torrentURL, true);
      
      // Notify the user about the successful adding
      window.alert(torrentURL + ' was added for download.');
      
      // Prevent the clicked torrent file from downloading in browser
      event.preventDefault();
    })
  });
});
