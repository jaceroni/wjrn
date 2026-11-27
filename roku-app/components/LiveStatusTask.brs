sub init()
    m.top.functionName = "runTask"
end sub

' Polls the live relay's status file every 10s. A failed fetch keeps the last known state.
sub runTask()
    while true
        urlTransfer = CreateObject("roUrlTransfer")
        urlTransfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
        urlTransfer.SetUrl("https://radio.jacewonmusic.com/live/status.json")
        response = urlTransfer.GetToString()

        if response <> "" and response <> invalid
            data = ParseJson(response)
            ' The field only notifies on a change, so setting it every poll is harmless.
            if data <> invalid and data.live <> invalid then m.top.live = data.live
        end if

        sleep(10000)
    end while
end sub
