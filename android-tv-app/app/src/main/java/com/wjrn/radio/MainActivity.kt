package com.wjrn.radio

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        webView = WebView(this)
        setContentView(webView)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                webView.requestFocus()
            }
        }

        webView.loadUrl("https://radio.jacewonmusic.com/player/")
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) return super.dispatchKeyEvent(event)

        when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                touchArtwork()
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_NEXT,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                touchNextStation()
                return true
            }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_PREVIOUS,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                touchPrevStation()
                return true
            }
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN -> return true
        }

        return super.dispatchKeyEvent(event)
    }

    // Dispatch a real touch event at a hit-zone's center, given its coordinates within the
    // player's native 1280x443 canvas. The web player's AudioContext requires a genuine user
    // gesture — evaluateJavascript doesn't satisfy that requirement (confirmed on-device:
    // DPAD_LEFT/RIGHT routed through evaluateJavascript produced no effect at all, while this
    // same touch-dispatch approach already worked reliably for play/pause), but a real
    // MotionEvent does. MainActivity loads the player with no ?popout= param (Backdrop Mode),
    // which positions the receiver's native canvas at (320, 340) within a 1920x1080 scene —
    // so canvas-space coordinates just need that offset added, no extra scaling.
    private fun dispatchTouchAtCanvasPoint(canvasX: Float, canvasY: Float) {
        val dm = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(dm)
        val scale = minOf(dm.widthPixels / 1920f, dm.heightPixels / 1080f)
        val offsetX = (dm.widthPixels - 1920f * scale) / 2f
        val offsetY = (dm.heightPixels - 1080f * scale) / 2f
        val x = offsetX + (320f + canvasX) * scale
        val y = offsetY + (340f + canvasY) * scale
        val now = SystemClock.uptimeMillis()
        webView.dispatchTouchEvent(MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x, y, 0))
        webView.dispatchTouchEvent(MotionEvent.obtain(now, now + 100L, MotionEvent.ACTION_UP, x, y, 0))
    }

    // hz-art center: left 111, top 101, width 274, height 274
    private fun touchArtwork() = dispatchTouchAtCanvasPoint(111f + 137f, 101f + 137f)

    // hz-tuning-knob center: left 993, top 212, width 188, height 67 — forward only
    private fun touchNextStation() = dispatchTouchAtCanvasPoint(993f + 94f, 212f + 33.5f)

    // hz-prev center: left 5, top 5, width 20, height 20 — invisible, remote-only backward hit zone
    private fun touchPrevStation() = dispatchTouchAtCanvasPoint(5f + 10f, 5f + 10f)

    private fun hideSystemUI() {
        val decorView = window.decorView
        decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
}
