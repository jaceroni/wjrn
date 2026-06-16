# TASK: Implement Analog Static Glitch on Logo & Page Headlines

We want to upgrade the logo hover effect and page headlines to use a high-intensity "analog static/television white noise" glitch effect on page load and mouse hover.

## Files in Scope
- `index.html`
- `src/index.css`

---

## Technical Specifications

### 1. Update SVG Filters in `index.html`
Locate the hidden `<svg>` block containing `<defs>` (around line 40). Replace the existing `<defs>` block with the following definition. This updates the logo filter to a heavy turbulence static (scale 25) and defines a new `#text-interference` filter (scale 12) for the headlines:

```html
    <!-- Hidden SVG filter bank — shared across all pages -->
    <svg style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <!-- Radio wave / RF interference displacement filter for logo hover -->
        <filter id="logo-interference" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <!-- Rapidly animate the seed to create frame-by-frame white noise static -->
          <!-- High vertical frequency (0.95) creates thin horizontal scanlines/tears -->
          <feTurbulence type="turbulence" baseFrequency="0.02 0.95" numOctaves="2" seed="1" result="wave">
            <animate attributeName="seed"
              values="1;5;9;3;7;2;8;4;6;1"
              dur="0.25s" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="wave" scale="25" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feComposite in="displaced" in2="SourceGraphic" operator="in"/>
        </filter>

        <!-- RF interference displacement filter for text/headlines (slightly lower scale for legibility) -->
        <filter id="text-interference" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <feTurbulence type="turbulence" baseFrequency="0.03 0.95" numOctaves="2" seed="1" result="wave">
            <animate attributeName="seed"
              values="1;5;9;3;7;2;8;4;6;1"
              dur="0.25s" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="wave" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feComposite in="displaced" in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
    </svg>
```

### 2. Configure CSS Hover Styles for Headlines in `src/index.css`
The page headlines already have the `.text-load-distortion` class which triggers `filter: url(#text-interference)` on page load. We need to add a hover rule so the static glitch also triggers when the user hovers over them.

Locate the `@media (hover: hover)` block at the bottom of `src/index.css` (around line 145) and update it as follows:

```css
@media (hover: hover) {
  .group-logo:hover {
    filter: url(#logo-interference) !important;
  }
  .text-load-distortion:hover {
    filter: url(#text-interference) !important;
    cursor: default;
  }
}
```

---

## Verification & Deployment Plan
1. Run `npm run build` to verify the bundle compiles.
2. **Page Load Check**: On refresh, verify that the headlines distort with analog static for 2.5 seconds before settling.
3. **Hover Checks**:
   * Hover over the WJRN logo in the header: Verify it distorts with high-intensity analog tearing.
   * Hover over the main headlines: Verify they distort with static lines but remain legible (due to the lower displacement scale).
4. Run the deploy script once verified:
   ```bash
   bash deploy.sh "design: implement heavy analog static logo and headline glitch"
   ```
