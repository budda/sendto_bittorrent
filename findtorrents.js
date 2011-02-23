jQuery(document).ready(function() {
  var sdkCtl = new SdkCtl();
  
  chrome.extension.sendRequest({name: "getOptions"},
   function(response) {
        sdkCtl.nasboxurl = response.nasboxurl;
   });


  
  jQuery('a[href$="torrent"]').each(function() {
    jQuery(this).click(function(event) {
      var torrentURL = jQuery(this).attr("href");
      sdkCtl.torrentAddUrl(torrentURL, true);
            
      window.alert(torrentURL + ' was added for download.');
      
      event.preventDefault();
    })
  });
});
