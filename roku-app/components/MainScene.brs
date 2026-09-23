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

    ' Ticker scroll is driven per-tick by this Timer, not a Roku Animation node — see the
    ' XML comment on tickerTimer for why. m.tickerX/m.tickerUnitWidth are plain numbers
    ' updated in onTickerTick, mirroring animateTicker()'s tickerX/tickerWidth in
    ' public/player/index.html exactly.
    m.tickerTimer = m.top.findNode("tickerTimer")
    m.tickerTimer.observeField("fire", "onTickerTick")
    m.tickerX = 0.0
    m.tickerUnitWidth = 1.0
    m.tickerTextGen = 0
    m.pendingTickerText = ""
    m.tickerTimer.control = "start"

    m.vuNeedle = m.top.findNode("vuNeedle")
    m.vuAnim = m.top.findNode("vuAnim")
    m.vuInterp = m.top.findNode("vuInterp")
    m.vuAnim.observeField("state", "onVuAnimStateChange")
    m.vuPlaying = false

    m.audioPlayer.observeField("state", "onAudioPlayerStateChange")
    m.sfxPlayer.observeField("state", "onSfxPlayerStateChange")
    m.pendingStation = invalid
    m.tuneGeneration = 0
    m.staticStartedForGen = -1
    m.lastMetaText = ""

    ' Real VU-meter behavior per direct request: rests at zero (m.vuRestRotation) when
    ' nothing's playing, rises to ~3/4 of the full sweep (m.vuActiveRotation) when audio
    ' starts, hovers there with a small unpredictable flutter while playing, and eases back
    ' down to zero (not an instant snap) on pause or station change. Full range matches the
    ' web player's reference sweep (see the long comment on the vuNeedle Rectangle in
    ' MainScene.xml): +0.785 rad = zero/idle, -0.785 rad = theoretical full/max.
    m.vuRestRotation = 0.785
    m.vuMaxRotation = -0.785
    m.vuActiveRotation = m.vuRestRotation + (m.vuMaxRotation - m.vuRestRotation) * 0.75
    m.vuFlutterRange = 0.12

    print "WJRN init: audioPlayer="; type(m.audioPlayer); " tunerTick="; type(m.tunerTick); " tickerText="; type(m.tickerText)
    print "WJRN init: tickAnim="; type(m.tickAnim); " tickInterp="; type(m.tickInterp); " tickerTimer="; type(m.tickerTimer)
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

    ' Reset so the new station's first real metadata always triggers a scroll restart,
    ' even on the rare chance its title+artist string happens to match the previous
    ' station's (the "TUNING TO..." text below is set directly, not through this guard).
    m.lastMetaText = ""

    ' Kick off the audio sequence FIRST, before touching anything else. Confirmed on-device:
    ' when this was moved after creating/starting the NowPlayingTask (a Task node spinning up
    ' its own thread + an HTTP request) and after startVU(), sfxPlayer got stuck at
    ' state="buffering" forever and never advanced — every single launch, no exceptions. Same
    ' playTuningStatic() code, only the surrounding order changed. Whatever the exact cause,
    ' starting the audio decoder before spinning up other threads/network work is what was
    ' actually confirmed working, so that ordering is restored here.
    ' Roku only allows ONE Audio node active in the whole app at a time — confirmed
    ' on-device (errorCode=-5 "only one playing instance supported"), and confirmed it cuts
    ' BOTH ways: static failed to start when the previous station's live stream was still
    ' playing, not just the reverse. m.tuneGeneration bumps on every call; advanceTuneSequence
    ' is a single re-entrant "do the next right thing" step, called again from every audio
    ' state-change event, so a rapid run of station changes always converges on the LAST one
    ' requested instead of getting confused partway through an abandoned earlier one.
    m.tuneGeneration = m.tuneGeneration + 1
    m.pendingStation = station
    advanceTuneSequence()

    ' Animate the tuner tick sliding to the new frequency instead of teleporting
    animateTunerTick(station.tickX)

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

    ' Needle drops back to zero the moment a station change is requested — it kicks back
    ' up in onAudioPlayerStateChange, once the new stream actually confirms state="playing",
    ' not just because tuning started.
    stopVU()
end sub

function isAudioIdle(state as String) as Boolean
    return state = "none" or state = "stopped" or state = "finished" or state = "error" or state = ""
end function

sub advanceTuneSequence()
    if m.pendingStation = invalid then return

    ' Already started static for THIS request — we're just waiting for it to finish, not
    ' checking whether to stop it. Real bug found via telnet: onSfxPlayerStateChange fires
    ' the instant sfxPlayer legitimately starts buffering its OWN clip, which used to fall
    ' through to the generic "not idle -> stop it" check below and immediately kill the
    ' static it had just been told to play — every time, which is why it never got past
    ' "buffering". This branch has to come first so a state we caused ourselves (buffering,
    ' playing) is never mistaken for a competing session that needs to be stopped.
    if m.staticStartedForGen = m.tuneGeneration
        if not isAudioIdle(m.sfxPlayer.state) then return
        station = m.pendingStation
        m.pendingStation = invalid
        startLiveStream(station)
        return
    end if

    ' Haven't started static for this request yet — first make sure nothing else is
    ' occupying the single shared audio slot before we try.
    if not isAudioIdle(m.audioPlayer.state)
        m.audioPlayer.control = "stop"
        return
    end if

    if not isAudioIdle(m.sfxPlayer.state)
        m.sfxPlayer.control = "stop"
        return
    end if

    m.staticStartedForGen = m.tuneGeneration
    playTuningStatic()
end sub

sub startLiveStream(station as Object)
    streamContent = createObject("roSGNode", "ContentNode")
    streamContent.url = station.stream
    streamContent.streamformat = "mp3"
    ' Continuous internet-radio stream, not a fixed-length file — per Roku's own
    ' ContentNode docs this needs to be flagged explicitly.
    streamContent.live = true

    m.audioPlayer.content = streamContent
    m.audioPlayer.control = "play"
    print "WJRN startLiveStream: starting "; station.name
end sub

sub onSfxPlayerStateChange()
    print "WJRN sfxPlayer state changed to: "; m.sfxPlayer.state
    advanceTuneSequence()
end sub

sub onAudioPlayerStateChange()
    print "WJRN audioPlayer state changed to: "; m.audioPlayer.state
    if m.audioPlayer.state = "error"
        print "WJRN audioPlayer errorCode="; m.audioPlayer.errorCode; " errorMsg="; m.audioPlayer.errorMsg
    end if
    ' Needle kicks up only once the stream is genuinely confirmed playing, not just when
    ' tuning was requested.
    if m.audioPlayer.state = "playing" then startVU()
    advanceTuneSequence()
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
        newText = artist + " – " + title
    else if title <> invalid and title <> ""
        newText = title
    else
        newText = station.name + " (" + station.freq.toStr() + " FM)"
    end if

    ' NowPlayingTask polls every 15s regardless of whether the track actually changed, and
    ' this fired setTickerText() every single time — which fully restarts the scroll
    ' animation from x=0. A ~7-10s scroll loop getting reset by an unrelated 15s timer
    ' landed at a different point in the cycle each time, which is exactly the "glitches
    ' partway through, no fixed pattern" stutter reported. Only restart the scroll when the
    ' text actually changed.
    if newText <> m.lastMetaText
        m.lastMetaText = newText
        setTickerText(newText)
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
' A CONTINUOUS one-direction right-to-left loop, always running. Movement is driven by
' onTickerTick (below) — a real running number decremented every tick and wrapped via
' modulo, NOT a Roku Animation node with repeat="true" (an Animation-based version was
' still producing a periodic hitch on real hardware). The wrap width now comes from a
' REAL measurement (TextMeasureTask, which can use roFontRegistry since it runs on a
' Task thread, not the render thread where that component is confirmed unusable) instead
' of a guessed px-per-character constant — the guess didn't exactly match the real
' rendered width of the bundled JetBrains Mono font, so the wrap point was landing on a
' position that wasn't truly pixel-identical to the start, producing a small visible
' "jog" every loop. That mismatch also left m.tickerX sitting on non-integer pixel values
' after the first wrap (since the guessed width was never a whole number), which is very
' likely what read as the text edges "shimmering" — subpixel positions force the renderer
' to re-antialias glyph edges every tick; onTickerTick now truncates to a whole pixel
' before ever setting translation, and a real measured width won't drift off-integer the
' way a fractional guess did.
function repeatString(s as String, times as Integer) as String
    result = ""
    for i = 1 to times
        result = result + s
    end for
    return result
end function

sub setTickerText(rawText as String)
    ' Matches the web player's #ticker-text exactly: text-transform: uppercase.
    text = UCase(rawText) + "     "

    ' Real measurement is async (a fresh Task, like NowPlayingTask's own pattern). The
    ' currently-displayed ticker content is left untouched until the measurement comes
    ' back — no blank/flash gap — and m.tickerTextGen guards against a slower, now-stale
    ' measurement (from an earlier setTickerText call this one superseded) landing after
    ' a newer one already applied.
    m.tickerTextGen = m.tickerTextGen + 1
    m.pendingTickerText = text

    measureTask = CreateObject("roSGNode", "TextMeasureTask")
    measureTask.gen = m.tickerTextGen
    measureTask.observeField("measuredWidth", "onTickerWidthMeasured")
    measureTask.text = text
    measureTask.control = "RUN"
end sub

sub onTickerWidthMeasured(event as Object)
    task = event.GetRoSGNode()
    if task.gen <> m.tickerTextGen then return

    unitWidth = task.measuredWidth
    if unitWidth <= 0 then unitWidth = Len(m.pendingTickerText) * 8.4

    boxWidth = 460
    repeats = Cint(boxWidth / unitWidth) + 3
    repeatedText = repeatString(m.pendingTickerText, repeats)

    m.tickerText.text = repeatedText
    m.tickerGlow1.text = repeatedText
    m.tickerGlow2.text = repeatedText

    m.tickerX = 0.0
    m.tickerUnitWidth = unitWidth
    m.tickerScroll.translation = [0, 0]
    print "WJRN onTickerWidthMeasured: text="; m.pendingTickerText; " realUnitWidth="; unitWidth; " repeats="; repeats
end sub

' Fires every 0.02s (see tickerTimer in MainScene.xml) — exact port of animateTicker()'s
' per-frame update in public/player/index.html: decrement a plain number, wrap it via
' modulo once it passes one full repeat-unit width. No Animation node, no repeat="true",
' no "restart" of anything — just a running number, so there's nothing that can hitch at
' a loop boundary because there is no loop boundary, only a continuously wrapping value.
' Truncated to a whole pixel before rendering — see the comment above setTickerText for
' why that matters.
sub onTickerTick()
    ' Reference speed: 50px/sec. duration=0.02s per tick -> 1px/tick.
    m.tickerX = m.tickerX - 1.0
    if m.tickerX <= -m.tickerUnitWidth
        m.tickerX = m.tickerX + m.tickerUnitWidth
    end if
    m.tickerScroll.translation = [Int(m.tickerX), 0]
end sub

' ── Decorative VU meter needle ───────────────────────────────────────────────
' Confirmed against Roku's own Audio node field reference: there is no level/amplitude/
' waveform field anywhere on it — nothing equivalent to Web Audio's AnalyserNode exists in
' BrightScript. A genuinely audio-reactive needle is not buildable on this platform, full
' stop. What it does instead, per direct request: rests at zero (m.vuRestRotation) when
' nothing's audible, eases up to ~3/4 of the sweep (m.vuActiveRotation) once real audio is
' confirmed playing, hovers there with a small unpredictable flutter while playing, and
' eases back down to zero — with real animated motion, not an instant snap — the moment
' it's paused or a new station is tuned. vuAnim is never set to repeat; each cycle
' explicitly picks its own target/duration and restarts itself via onVuAnimStateChange, so
' the flutter never locks into a visible fixed cadence.
sub startVU()
    print "WJRN startVU called"
    m.vuPlaying = true
    runVuCycle()
end sub

sub runVuCycle()
    if m.vuPlaying
        ' Hovering near the 3/4 mark with a small, unpredictable flutter — not ticking
        ' rapidly, just gently unsettled, like it's reacting to something even though it
        ' isn't tied to real levels.
        peak = m.vuActiveRotation + (Rnd(0) * 2 - 1) * m.vuFlutterRange
        m.vuAnim.duration = 0.5 + Rnd(0) * 0.9
    else
        ' Not playing — ease back down to the resting/zero position and stop there (no
        ' further cycles get triggered once this one finishes; see onVuAnimStateChange).
        peak = m.vuRestRotation
        m.vuAnim.duration = 0.6
    end if
    m.vuInterp.keyValue = [m.vuNeedle.rotation, peak]
    m.vuInterp.key = [0.0, 1.0]
    m.vuAnim.control = "start"
end sub

sub onVuAnimStateChange()
    if m.vuAnim.state = "stopped" and m.vuPlaying = true
        runVuCycle()
    end if
end sub

sub stopVU()
    m.vuPlaying = false
    ' One eased fall back to rest, not an instant jump — runVuCycle() reads m.vuPlaying
    ' (already false here) and animates toward m.vuRestRotation instead of snapping there.
    runVuCycle()
end sub

' ── One-shot tuning static sound effect ──────────────────────────────────────
sub playTuningStatic()
    sfxContent = createObject("roSGNode", "ContentNode")
    sfxContent.url = "pkg:/audio/tuning-static.mp3"
    sfxContent.streamformat = "mp3"
    m.sfxPlayer.content = sfxContent
    m.sfxPlayer.control = "play"
    print "WJRN playTuningStatic: sfxPlayer.control="; m.sfxPlayer.control; " sfxPlayer.state="; m.sfxPlayer.state
end sub
