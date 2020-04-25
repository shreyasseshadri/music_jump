const updateTab = async (tabId,link) => {
  return new Promise(resolve => {
      chrome.tabs.update(tabId,{url:link},async (tab) => {

        chrome.tabs.onUpdated.addListener(function (tabId , info) {
          if (info.status === 'complete') {
            resolve()
          }
        });

      })
  })
}


chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"},async function(response){
        
          console.log("background response",response.playlists)
          var playlists = response['playlists']

          // chrome.tabs.update(activeTab.id,{url:playlists[0].link})
          await updateTab(activeTab.id,playlists[0].link)

          chrome.tabs.sendMessage(activeTab.id,{"message":"opened_tab"},function(response){
            console.log("Songs",response)
          })

          // playlists.map((playlist) => {
          //   chrome.tabs.update(activeTab.id,{url:playlist.link})
          //   chrome.tabs.sendMessage(activeTab.id,{"message":"opened_tab"},function(response){
          //     console.log("New response",response)
          //   })
          // })
      }); 
      
    });
  });