sub init()
    m.audioPlayer = m.top.findNode("audioPlayer")
    m.sfxPlayer = m.top.findNode("sfxPlayer")
    m.tunerTick = m.top.findNode("tunerTick")
    m.tunerTickShadow = m.top.findNode("tunerTickShadow")
    m.tickerScroll = m.top.findNode("tickerScroll")
    m.tickerText = m.top.findNode("tickerText")
    m.tickerGlow1 = m.top.findNode("tickerGlow1")
    m.tickerGlow2 = m.top.findNode("tickerGlow2")
    m.albumArtBase = m.top.findNode("albumArtBase")
    m.albumArtRemote = m.top.findNode("albumArtRemote")

    m.tickAnim = m.top.findNode("tickAnim")
    m.tickInterp = m.top.findNode("tickInterp")
    m.tickShadowInterp = m.top.findNode("tickShadowInterp")
    m.tickerAnim = m.top.findNode("tickerAnim")
    m.tickerInterp = m.top.findNode("tickerInterp")

    m.vuNeedle = m.top.findNode("vuNeedle")
    m.vuAnim = m.top.findNode("vuAnim")
    m.vuInterp = m.top.findNode("vuInterp")
    ' Matches drawVU() in public/player/index.html: vuAngle sweeps from PI/4 to PI/4+PI/2
    ' (a 90° arc). See the long comment on the vuNeedle Rectangle in MainScene.xml for the
    ' full canvas-angle-to-Roku-rotation derivation — net result is the needle's `rotation`
    ' field ranges from +0.785 rad (idle/quiet, swung toward up-left) to -0.785 rad
    ' (loud/max, swung toward up-right), pivoting around its base the whole time.
    m.vuRestRotation = 0.785
    m.vuMaxRotation = -0.785

    print "WJRN init: audioPlayer="; type(m.audioPlayer); " tunerTick="; type(m.tunerTick); " tickerText="; type(m.tickerText)
    print "WJRN init: tickAnim="; type(m.tickAnim); " tickInterp="; type(m.tickInterp); " tickerAnim="; type(m.tickerAnim); " tickerInterp="; type(m.tickerInterp)
    print "WJRN init: vuNeedle="; type(m.vuNeedle); " vuAnim="; type(m.vuAnim); " vuInterp="; type(m.vuInterp)

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
    print "WJRN tuneToStation: "; station.name; " shortcode="; station.shortcode

    ' Swap audio stream — kept as the first thing that happens, matching the original
    ' working order, before any of the newer animation/SFX calls below.
    streamContent = createObject("roSGNode", "ContentNode")
    streamContent.url = station.stream
    streamContent.streamformat = "mp3"

    m.audioPlayer.content = streamContent
    m.audioPlayer.control = "play"

    ' Animate the tuner tick sliding to the new frequency instead of teleporting
    animateTunerTick(station.tickX)

    ' One-shot tuning static burst, independent of the stream audio node
    playTuningStatic()

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
    print "WJRN onMetadataChange fired, metadata="; type(metadata)
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
    shadowStartPos = m.tunerTickShadow.translation
    m.tickInterp.keyValue = [startPos, [targetX, 133]]
    m.tickInterp.key = [0.0, 1.0]
    ' Shadow rectangle is offset +1,+2 from the real tick line — keep that fixed offset
    ' as it slides so it still reads as a shadow the whole way, not just at rest.
    m.tickShadowInterp.keyValue = [shadowStartPos, [targetX + 1, 135]]
    m.tickShadowInterp.key = [0.0, 1.0]
    m.tickAnim.control = "start"
    print "WJRN animateTunerTick: from="; startPos; " to=["; targetX; ", 133] control="; m.tickAnim.control
end sub

' ── Metadata ticker + marquee ────────────────────────────────────────────────
' Roku's Label has no built-in marquee — long text is scrolled manually via a looping
' translation animation; short text just sits centered-left, static. Containment comes
' from tickerClip's clippingRect (see MainScene.xml) — text is never actually visible
' outside the ticker window, however far it scrolls. Character-count is a rough stand-in
' for real text-width measurement (Roku doesn't expose that pre-render without extra work).
sub setTickerText(rawText as String)
    ' Matches the web player's #ticker-text exactly: text-transform: uppercase.
    text = UCase(rawText)
    m.tickerText.text = text
    m.tickerGlow1.text = text
    m.tickerGlow2.text = text
    m.tickerAnim.control = "stop"
    m.tickerScroll.translation = [0, 0]

    ' tickerScroll's translation is relative to the tickerClip Group's own origin (which
    ' sits at [410, 214] in playerContainer) — so 0 is "at rest," scrolling is purely
    ' negative from there, and animating this one wrapping group moves all three stacked
    ' labels (the real text + its two glow copies) together. tickerClip's clippingRect
    ' keeps anything off-window hidden.
    ' Recalibrated for the real 14px font (was tuned for the old, wrong 28px system font —
    ' half that per-character estimate now that the font is actually half the size).
    approxTextWidth = Len(text) * 8
    visibleWidth = 569
    print "WJRN setTickerText: text="; text; " len="; Len(text); " approxWidth="; approxTextWidth; " willScroll="; (approxTextWidth > visibleWidth)
    if approxTextWidth > visibleWidth
        scrollDistance = (approxTextWidth - visibleWidth) + 60
        ' Three keyframes (out, then back to start) instead of two — with only two and
        ' repeat=true, Roku snaps instantly back to the first keyframe every loop instead
        ' of reversing, which is exactly the "spazzing" jump the VU needle had for the same
        ' reason (see startVU()). This scrolls out and eases back smoothly instead.
        m.tickerInterp.keyValue = [[0, 0], [0 - scrollDistance, 0], [0, 0]]
        m.tickerInterp.key = [0.0, 0.5, 1.0]
        m.tickerAnim.duration = (Len(text) * 0.24)
        m.tickerAnim.control = "start"
        print "WJRN setTickerText: scrollDistance="; scrollDistance; " duration="; m.tickerAnim.duration; " control="; m.tickerAnim.control
    end if
end sub

' ── Decorative VU meter needle ───────────────────────────────────────────────
' Roku's Audio node has no real-time amplitude/frequency API like Web Audio's AnalyserNode,
' so this sweeps the needle back and forth between its rest and max rotation while playing —
' a decorative loop, not genuine audio analysis (see the derivation comment in init()/XML).
sub startVU()
    print "WJRN startVU called"
    ' Three keyframes (rest -> max -> rest), not two — with only two and repeat=true, Roku
    ' snaps instantly back to the first keyframe every loop instead of reversing, which is
    ' the "spazzing / full left, full right, snap" behavior reported on-device. This sweeps
    ' out and back smoothly within each cycle instead.
    m.vuInterp.keyValue = [m.vuRestRotation, m.vuMaxRotation, m.vuRestRotation]
    m.vuInterp.key = [0.0, 0.5, 1.0]
    m.vuAnim.control = "start"
    print "WJRN startVU: vuAnim.control="; m.vuAnim.control
end sub

sub stopVU()
    m.vuAnim.control = "stop"
    m.vuNeedle.rotation = m.vuRestRotation
end sub

' ── One-shot tuning static sound effect ──────────────────────────────────────
sub playTuningStatic()
    sfxContent = createObject("roSGNode", "ContentNode")
    sfxContent.url = "pkg:/audio/tuning-static.mp3"
    sfxContent.streamformat = "mp3"
    m.sfxPlayer.content = sfxContent
    m.sfxPlayer.control = "play"
end sub
