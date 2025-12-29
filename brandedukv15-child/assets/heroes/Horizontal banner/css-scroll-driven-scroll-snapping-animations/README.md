# CSS scroll-driven scroll-snapping animations

A Pen created on CodePen.

Original URL: [https://codepen.io/giana/pen/BabdgjB](https://codepen.io/giana/pen/BabdgjB).

**Currently only works on Chrome desktop**

A polyfill is included for other browsers, but it's iffy.

These last couple of years have really been **it** for CSS. This cold, dead heart may be resurrecting.

Some section transitions I made while learning about scroll-driven animations. This is a flaky layout, not very practical (*especially* not the backwards scroll), but sometimes you need to have fun.

Oddly enough, the thing that took the most time concerning this demo was the dang shape-outside (text floating around image), which Chrome treats in the most bizarre and frustrating way possible. It involved me trying to center a floating element without using any of the following (all discovered painfully, one at a time): flexbox, grid, display: inline-block, display: table,  translate, position top/bottom,  negative margins. I finally gave up.

- [Animate elements on scroll with scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)

- [CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)

- [Polyfill](https://github.com/flackr/scroll-timeline)