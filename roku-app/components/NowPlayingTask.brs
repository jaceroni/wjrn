sub init()
    m.top.functionName = "runTask"
end sub

sub runTask()
    shortcode = m.top.shortcode
    print "WJRN NowPlayingTask runTask started, shortcode="; shortcode
    if shortcode = "" or shortcode = invalid then return

    url = "https://radio.jacewonmusic.com/api/nowplaying/" + shortcode

    while true
        urlTransfer = CreateObject("roUrlTransfer")
        urlTransfer.SetUrl(url)
        response = urlTransfer.GetToString()
        print "WJRN NowPlayingTask fetch "; url; " -> response len="; Len(response)

        if response <> "" and response <> invalid
            data = ParseJson(response)
            print "WJRN NowPlayingTask parsed data="; type(data)
            if data <> invalid
                np = data.now_playing
                if np <> invalid and np.song <> invalid
                    metadata = {}
                    metadata.title = np.song.title
                    metadata.artist = np.song.artist
                    metadata.artUrl = np.song.art
                    print "WJRN NowPlayingTask setting metadata title="; metadata.title; " artist="; metadata.artist
                    m.top.metadata = metadata
                else
                    print "WJRN NowPlayingTask: np or np.song invalid"
                end if
            end if
        end if

        sleep(15000)
    end while
end sub
