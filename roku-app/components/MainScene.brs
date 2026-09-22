sub init()
    m.audioPlayer = m.top.findNode("audioPlayer")
    m.sfxPlayer = m.top.findNode("sfxPlayer")
    m.tunerTick = m.top.findNode("tunerTick")
    m.tickerText = m.top.findNode("tickerText")
    m.albumArtBase = m.top.findNode("albumArtBase")
    m.albumArtRemote = m.top.findNode("albumArtRemote")

    m.tickAnim = m.top.findNode("tickAnim")
    m.tickInterp = m.top.findNode("tickInterp")
    m.tickerAnim = m.top.findNode("tickerAnim")
    m.tickerInterp = m.top.findNode("tickerInterp")

    m.vuBars = [m.top.findNode("vuBar0"), m.top.findNode("vuBar1"), m.top.findNode("vuBar2"), m.top.findNode("vuBar3")]
    m.vuAnims = [m.top.findNode("vuAnim0"), m.top.findNode("vuAnim1"), m.top.findNode("vuAnim2"), m.top.findNode("vuAnim3")]
    m.vuInterps = [m.top.findNode("vuInterp0"), m.top.findNode("vuInterp1"), m.top.findNode("vuInterp2"), m.top.findNode("vuInterp3")]
    m.vuRanges = [[8.0, 28.0], [8.0, 36.0], [6.0, 24.0], [8.0, 32.0]]

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

    ' Animate the tuner tick sliding to the new frequency instead of teleporting
    animateTunerTick(station.tickX)

    ' One-shot tuning static burst, independent of the stream audio node
    playTuningStatic()

    ' Swap audio stream
    streamContent = createObject("roSGNode", "ContentNode")
    streamContent.url = station.stream
    streamContent.streamformat = "mp3"

    m.audioPlayer.content = streamContent
    m.audioPlayer.control = "play"
    startVU()

    ' Update status on the ticker
    setTickerText("TUNING TO " + station.name + " (" + station.freq.toStr() + " FM)...")

    ' Clear remote art so the always-present base/fallback poster shows through instead of
    ' a blank gap while new art loads (Poster nodes don't retain the old image mid-load).
    m.albumArtRemote.uri = ""

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
        setTickerText("PAUSED – " + m.stations[m.activeStationIndex].name)
        stopVU()
    else
        m.audioPlayer.control = "resume"
        setTickerText("PLAYING – " + m.stations[m.activeStationIndex].name)
        startVU()
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
        setTickerText(artist + " – " + title)
    else if title <> invalid and title <> ""
        setTickerText(title)
    else
        setTickerText(station.name + " (" + station.freq.toStr() + " FM)")
    end if

    if artUrl <> invalid and artUrl <> ""
        m.albumArtRemote.uri = artUrl
    end if
end sub

' ── Tuner tick slide ─────────────────────────────────────────────────────────
sub animateTunerTick(targetX as Float)
    m.tickAnim.control = "stop"
    startPos = m.tunerTick.translation
    m.tickInterp.keyValue = [startPos, [targetX, 133]]
    m.tickInterp.key = [0.0, 1.0]
    m.tickAnim.control = "start"
end sub

' ── Metadata ticker + marquee ────────────────────────────────────────────────
' Roku's Label has no built-in marquee — long text is scrolled manually via a looping
' translation animation; short text just sits centered-left, static. The faceplate PNG's
' own opaque art crops anything that scrolls past the real ticker window, so no separate
' clip mask is needed. Character-count is a rough stand-in for real text-width measurement.
sub setTickerText(text as String)
    m.tickerText.text = text
    m.tickerAnim.control = "stop"
    m.tickerText.translation = [410, 214]

    approxTextWidth = Len(text) * 16
    visibleWidth = 569
    if approxTextWidth > visibleWidth
        scrollDistance = (approxTextWidth - visibleWidth) + 60
        m.tickerInterp.keyValue = [[410, 214], [410 - scrollDistance, 214]]
        m.tickerInterp.key = [0.0, 1.0]
        m.tickerAnim.duration = (Len(text) * 0.12)
        m.tickerAnim.control = "start"
    end if
end sub

' ── Decorative VU meter ──────────────────────────────────────────────────────
' Roku's Audio node has no real-time amplitude/frequency API like Web Audio's AnalyserNode,
' so this is a lively decorative loop tied to play/pause state, not genuine audio analysis.
sub startVU()
    for i = 0 to m.vuBars.count() - 1
        range = m.vuRanges[i]
        m.vuInterps[i].keyValue = [range[0], range[1]]
        m.vuInterps[i].key = [0.0, 1.0]
        m.vuAnims[i].control = "start"
    end for
end sub

sub stopVU()
    for i = 0 to m.vuAnims.count() - 1
        m.vuAnims[i].control = "stop"
        m.vuBars[i].height = m.vuRanges[i][0]
    end for
end sub

' ── One-shot tuning static sound effect ──────────────────────────────────────
sub playTuningStatic()
    sfxContent = createObject("roSGNode", "ContentNode")
    sfxContent.url = "pkg:/audio/tuning-static.mp3"
    sfxContent.streamformat = "mp3"
    m.sfxPlayer.content = sfxContent
    m.sfxPlayer.control = "play"
end sub
