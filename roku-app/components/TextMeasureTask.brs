sub init()
    m.top.functionName = "runTask"
end sub

sub runTask()
    text = m.top.text

    fontRegistry = CreateObject("roFontRegistry")
    fontRegistry.Register("pkg:/fonts/JetBrainsMono-Regular.ttf")
    families = fontRegistry.GetFamilies()

    familyName = ""
    if families <> invalid and families.count() > 0
        familyName = families[0]
    end if

    width = 0.0
    if familyName <> ""
        font = fontRegistry.GetFont(familyName, 14, false, false)
        if font <> invalid
            width = font.GetOneLineWidth(text, 5000)
        end if
    end if

    ' Fallback if registration/lookup ever fails for some reason — same rough estimate
    ' used before real measurement existed, better than a zero-width ticker.
    if width <= 0
        width = Len(text) * 8.4
    end if

    m.top.measuredWidth = width
end sub
