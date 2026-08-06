# Hero Specification

- **Target file:** `src/components/Hero.tsx`
- **Interaction model:** static + scroll (whole hero is inside a `Reveal`-style transition container)

## DOM Structure

```
section/div.relative.overflow-hidden  (background: linear-gradient(#080D1B 0%, #273D5D 32.21%, #A3B3CA 65.87%, #EFEFEF 100%); height ~1253px desktop)
  div.flex.absolute.z-10.top-[64px].left-0.right-0.flex-col.items-center
    div.flex.flex-col.items-center
      h1 "The only crypto platform you need"
        text-[45px] lg:text-[84px] font-[550] leading-[100%] lg:leading-[110%] tracking-[-1.44px] lg:tracking-[-1.68px] text-[#F7F9FA] text-center max-w-[900px]
      div.text-[20px] lg:text-[28px] font-[600] leading-normal mb-6 text-center text-[#A0A9BE] px-4 lg:px-0
        p "Trade BTC, ETH, CRO, and 400+ crypto in your local currency"
      a (Get Started CTA)
        relative flex h-[59px] p-[12px_24px] items-center justify-center gap-2 rounded-[10px] bg-[#1199FA]
        p.text-[14px] font-[600] leading-[142%] text-[#F7F9FA] "Get Started"
        svg arrow-right 16px fill #F7F9FA
  div.flex.px-4.md:px-0.mt-[390px].md:mt-[340px].lg:mt-[400px].-mb-[140px].md:-mb-[100px].lg:-mb-[260px]  (hero image wrapper)
    div.object-contain.w-full
      img /cdc_home_heroimage_desktop_highres_global(usd)_1_1x.webp  (5770x4222, object-contain, w-full)
  div.absolute.z-20.right-0.bottom-0.left-0.h-[140px]  (bottom fade)
    background: linear-gradient(rgba(8,13,27,0) 0%, #080D1B 60%)
```

## Exact values

- H1: font 84px/92.4px (desktop), weight 550, letter-spacing -1.68px, color #F7F9FA, centered. Mobile: 45px, leading 100%, tracking -1.44px.
- Subtitle: 28px/33.6px (desktop), weight 600, color #A0A9BE, centered, margin-bottom 24px. Mobile: 20px.
- CTA button: height 59px, padding 12px 24px, border-radius 10px, bg #1199FA, gap 8px; text 14px/19.88px weight 600 #F7F9FA; arrow icon 16px.
- Hero image: full-width, object-contain, margin-top 400px (desktop), margin-bottom -260px; image aspect 5770x4222 (w 1.37:1).
- Bottom fade: absolute, z-20, left/right/bottom 0, height 140px, gradient transparent → #080D1B 60%.
- Hero container is immediately followed by the next section (white bg #F7F9FA-ish page bg) which visually overlaps due to negative margin.

## Assets
- `/cdc_home_heroimage_desktop_highres_global(usd)_1_1x.webp`

## Responsive
- Desktop 1440: h1 84px, image mt 400px -mb 260px
- Mobile 390: h1 45px, image mt 390px -mb 140px, px-4 padding
