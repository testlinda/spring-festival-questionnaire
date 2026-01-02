# _note

## Dev / mock reminder (important)

There *is* a dev mode.

```
Turn on mockMode / showDevPanel
```

When it’s on:
- No real data
- Things look suspiciously clean
- Responses timing controlled by mockDelay

Mock data lives somewhere in `/js/`.

If something feels “too safe”, check the config.

---

## Before using it for real

- Make sure mockMode / showDevPanel is OFF
- Double-check external endpoints
- Refresh hard (Ctrl+Shift+R) after config changes

**Do not test with real data casually.**

---

## When something breaks

Ask yourself:
- Did I restart the local server?
- Did I forget to switch modes?
- Did I change config but not reload?
