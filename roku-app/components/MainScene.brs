sub init()
    m.audioPlayer = m.top.findNode("audioPlayer")
    m.tunerTick = m.top.findNode("tunerTick")
    m.tickerText = m.top.findNode("tickerText")
    m.albumArt = m.top.findNode("albumArt")

    m.top.setFocus(true)

    ' Define stations (matching PlayerContext.tsx and public/player/index.html)
    m.stations = [
      { name: "WJRN", freq: 89.1, stream: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3", tickX: 682, shortcode: "wjrn" },
      { name: "THE ROCK GARDEN", freq: 95.5, stream: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3", tickX: 815, shortcode: "the_rock_garden" },
      { name: "BRIDGE CITY HANG SUITE", freq: 102.7, stream: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3", tickX: 965, shortcode: "bridge_city_hang_suite" },
      { name: "THE GOLDEN BOOMBOX", freq: 105.9, stream: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3", tickX: 1031, shortcode: "golden_boombox_sessions" }
    ]

    m.nowPlayingTask = invalid
    m.activeStationIndex = 0
    tuneToStation(m.activeStationIndex)
end sub

' Remote controller event handler
function onKeyEvent(key as String, press as Boolean) as Boolean
    handled = false

    if press then
        if (key = "right" or key = "fastforward")
            m.activeStationIndex = (m.activeStationIndex + 1) mod m.stations.count()
            tuneToStation(m.activeStationIndex)
            handled = true
        else if (key = "left" or key = "rewind")
            m.activeStationIndex = m.activeStationIndex - 1
            if m.activeStationIndex < 0 then m.activeStationIndex = m.stations.count() - 1
            tuneToStation(m.activeStationIndex)
            handled = true
        else if (key = "OK" or key = "play")
            togglePlayback()
            handled = true
        end if
    end if

    return handled
end function

sub tuneToStation(index as Integer)
    station = m.stations[index]

    ' Move Tuner Tick Line
    m.tunerTick.translation = [station.tickX, 133]

    ' Swap audio stream
    streamContent = createObject("roSGNode", "ContentNode")
    streamContent.url = station.stream
    streamContent.streamformat = "mp3"

    m.audioPlayer.content = streamContent
    m.audioPlayer.control = "play"

    ' Update status on the ticker
    m.tickerText.text = "TUNING TO " + station.name + " (" + station.freq.toStr() + " FM)..."

    ' Reset album art to fallback until API delivers real art
    m.albumArt.uri = "pkg:/images/wjrn-player-app-startup-screen.jpg"

    ' Stop the previous polling task and start a fresh one for this station
    if m.nowPlayingTask <> invalid
        m.nowPlayingTask.control = "STOP"
    end if

    m.nowPlayingTask = CreateObject("roSGNode", "NowPlayingTask")
    m.nowPlayingTask.observeField("metadata", "onMetadataChange")
    m.nowPlayingTask.shortcode = station.shortcode
    m.nowPlayingTask.control = "RUN"
end sub

sub togglePlayback()
    state = m.audioPlayer.state
    if state = "playing"
        m.audioPlayer.control = "pause"
        m.tickerText.text = "PAUSED – " + m.stations[m.activeStationIndex].name
    else
        m.audioPlayer.control = "resume"
        m.tickerText.text = "PLAYING – " + m.stations[m.activeStationIndex].name
    end if
end sub

sub onMetadataChange()
    metadata = m.nowPlayingTask.metadata
    if metadata = invalid then return

    station = m.stations[m.activeStationIndex]
    title = metadata.title
    artist = metadata.artist
    artUrl = metadata.artUrl

    if artist <> invalid and artist <> "" and title <> invalid and title <> ""
        m.tickerText.text = artist + " – " + title
    else if title <> invalid and title <> ""
        m.tickerText.text = title
    else
        m.tickerText.text = station.name + " (" + station.freq.toStr() + " FM)"
    end if

    if artUrl <> invalid and artUrl <> ""
        m.albumArt.uri = artUrl
    end if
end sub
