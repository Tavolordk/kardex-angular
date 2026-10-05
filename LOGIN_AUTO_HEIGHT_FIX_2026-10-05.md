# Login automatic height fix

- Removed visual `top` offsets as the source of overflow outside the shell.
- Desktop spacing now uses `padding-top` on `.login-shell`, which participates in normal layout and therefore increases the shell height.
- `.login-shell` uses `min-height: 100dvh` plus `height: auto`, so it fills the viewport when content is short and grows automatically when content is taller.
- Verification keeps its 82px visual offset through shell padding, also included in the calculated document height.
- Mobile resets the shell padding to zero.
- Scrolling remains owned by the document/root only.
