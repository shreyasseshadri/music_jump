function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.message){
            case "clicked_browser_action":{
                var playlist_objects = []
                var playlist_elements = Array.from(document.getElementsByClassName('ownedPlaylist')); 
                if(playlist_elements){
                    playlist_elements.map((playlist) => {
                        var a_tag = playlist.getElementsByTagName('a')[0]
                        if(a_tag){
                            playlist_objects.push({
                                name: a_tag.innerHTML,
                                link: a_tag.href
                            })
        
                        }
                    })
                }
                console.log("content",playlist_objects)
                sendResponse({"playlists":playlist_objects})
                break
            }
            case "opened_tab":{
                (async () => {
    
                    await sleep(10000)
                    var songTitles = Array.from(document.querySelectorAll("td.title")).map((title) => title.getAttribute("title"))
                    sendResponse({"titles":songTitles})
                })()
                break
            }
        }
        return true
    }
  );