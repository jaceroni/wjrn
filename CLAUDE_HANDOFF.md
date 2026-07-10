# WJRN Smart TV Handoff Instructions for Claude Code

This file contains the detailed punch list and compilation requirements to compile, package, and deploy the WJRN Vintage Experience to **Roku** and **Google TV / Android TV**.

---

## 1. Current Project State
The boilerplate file structures and baseline remote navigation listeners have already been generated:
*   **Web Player Navigation**: [public/player/index.html](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/index.html) has been updated with keyboard/remote listeners (`ArrowLeft`/`ArrowRight`/`Enter`) and an updated `switchStation(dir)` supporting backwards cycling.
*   **Roku App Stubs**: Located in [/roku-app/](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/roku-app).
*   **Google TV App Stubs**: Located in [/android-tv-app/](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/android-tv-app).

---

## 2. Punch List for Roku App (`/roku-app`)

### Task 2.1: Assets Preparation
Copy the visual assets from the web player folder into the Roku images folder:
1.  Create the `/roku-app/images` directory if it does not exist.
2.  Copy [public/player/wjrn-player-backdrop.jpg](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/wjrn-player-backdrop.jpg) $\rightarrow$ `roku-app/images/wjrn-player-backdrop.jpg`.
3.  Copy [public/player/wjrn-receiver-front-ko.png](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/wjrn-receiver-front-ko.png) $\rightarrow$ `roku-app/images/wjrn-receiver-front-ko.png`.
4.  Copy [public/player/wjrn-player-app-startup-screen.jpg](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/wjrn-player-app-startup-screen.jpg) $\rightarrow$ `roku-app/images/wjrn-player-app-startup-screen.jpg`.
5.  Copy [public/player/wjrn-player-thumbnail.jpg](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/wjrn-player-thumbnail.jpg) $\rightarrow$ `roku-app/images/wjrn-player-thumbnail.jpg`.

### Task 2.2: Implement Metadata Polling (Roku Task Node)
To load dynamic song metadata, create a BrightScript Task to run in the background:
1.  Create `components/NowPlayingTask.xml`:
    ```xml
    <?xml version="1.0" encoding="utf-8" ?>
    <component name="NowPlayingTask" extends="Task">
        <script type="text/brightscript" uri="pkg:/components/NowPlayingTask.brs" />
        <interface>
            <field id="shortcode" type="string" onChange="onShortcodeChange" />
            <field id="metadata" type="assocarray" />
        </interface>
    </component>
    ```
2.  Create `components/NowPlayingTask.brs`:
    *   Poll `https://radio.jacewonmusic.com/api/nowplaying/{shortcode}` every 15 seconds.
    *   Use `roUrlTransfer` and `ParseJson()`.
    *   Extract the active song `title`, `artist`, and `artUrl`.
    *   Expose this data back to `MainScene.brs` via the `metadata` interface field.
3.  In [MainScene.brs](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/roku-app/components/MainScene.brs#L67-L70), observe this metadata field and update `m.tickerText.text` and `m.albumArt.uri` dynamically.

### Task 2.3: Roku Sideloading/Packaging
*   Zip the contents of `roku-app/` (`manifest`, `source/`, `components/`, `images/`).
*   Upload the zip using the Roku developer web utility on the local network (`http://<roku-ip-address>`).
*   Retrieve the signed package `.pkg` from the packaging console for store upload.

---

## 3. Punch List for Google TV App (`/android-tv-app`)

### Task 3.1: Assets Preparation
Copy the launcher splash asset:
1.  Copy [public/player/wjrn-player-app-startup-screen.jpg](file:///Users/jacebrown/Dropbox/Jacewon/Radio/_dev/public/player/wjrn-player-app-startup-screen.jpg) $\rightarrow$ `android-tv-app/app/src/main/res/drawable/wjrn_startup_screen.jpg`.
2.  Set up a basic layout XML (`activity_main.xml`) or programmatic splash layout using this drawable.

### Task 3.2: Gradle Setup & Compilation
1.  Verify the local Android SDK paths.
2.  Compile the release bundle using:
    ```bash
    ./gradlew bundleRelease
    ```
    This outputs the signed Android App Bundle (`.aab`) under `/app/build/outputs/bundle/release/` ready for the Google Play Console.

---

## 4. Future Punch List (Post-Launch Phase)
*   **Twitch Audio Takeover**: Configure OBS to dual-stream. Stream video+audio to Twitch, and audio-only to AzuraCast's Live DJ mount point (`icecast://source:password@radio.jacewonmusic.com:8000/live` or RTMP equivalent). AzuraCast will handle the stream takeover automatically, meaning the TV apps will play the live stream audio with zero client changes.
