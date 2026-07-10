sub init()
    m.top.functionName = "runTask"
end sub

function runTask()
    shortcode = m.top.shortcode
    if shortcode = "" or shortcode = invalid then return

    url = "https://radio.jacewonmusic.com/api/nowplaying/" + shortcode

    while true
        urlTransfer = CreateObject("roUrlTransfer")
        urlTransfer.SetUrl(url)
        response = urlTransfer.GetToString()

        if response <> "" and response <> invalid
            data = ParseJson(response)
            if data <> invalid
                np = data.now_playing
                if np <> invalid and np.song <> invalid
                    metadata = {}
                    metadata.title = np.song.title
                    metadata.artist = np.song.artist
                    metadata.artUrl = np.song.art
                    m.top.metadata = metadata
                end if
            end if
        end if

        sleep(15000)
    end while
end function
