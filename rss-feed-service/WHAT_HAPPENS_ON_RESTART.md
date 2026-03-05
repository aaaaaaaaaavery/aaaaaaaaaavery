# What Happens When Computer Goes Off or Restarts?

## Quick Answer

**✅ YES - Everything picks back up automatically when you turn the computer back on!**

With the auto-start setup, the service will:
1. Start automatically when computer boots
2. Resume normal operation
3. Continue refreshing feeds on schedule
4. No manual intervention needed

---

## Detailed Scenarios

### Scenario 1: Computer Restarts (System Update, Manual Restart)

**What happens:**
1. Computer boots up (30-60 seconds)
2. macOS launches launchd
3. launchd sees `com.rssfeed.service.plist` with `RunAtLoad: true`
4. launchd automatically starts the RSS service
5. Service is running within 1-2 minutes of boot
6. Everything works normally

**Timeline:**
- **0:00** - Computer starts booting
- **0:30** - macOS fully loaded
- **0:35** - launchd starts RSS service
- **0:40** - Service is running and responding
- **0:45** - Cloudflare Tunnel connects (if set up)
- **1:00** - Everything is fully operational

**You don't need to do anything!**

---

### Scenario 2: Power Outage

**What happens:**
1. Computer loses power and shuts down
2. When power returns, computer boots up
3. Same process as Scenario 1 - service auto-starts
4. Service resumes normal operation

**Note:** 
- If you have a UPS (uninterruptible power supply), computer won't shut down
- Service continues running through brief power outages

---

### Scenario 3: Computer Sleeps (Display Off)

**If power settings are correct:**
- ✅ Computer stays awake (doesn't sleep)
- ✅ Service keeps running
- ✅ Everything continues working

**If computer does sleep:**
- ⚠️ Service pauses (can't run when sleeping)
- ✅ When computer wakes, service resumes
- ⚠️ May miss some refresh cycles while sleeping

**Solution:** Set "Computer sleep" to "Never" in Energy Saver settings

---

### Scenario 4: Service Crashes (Rare)

**What happens:**
1. Service encounters an error and crashes
2. launchd sees `KeepAlive: true` in plist
3. launchd automatically restarts the service
4. Service is back online within 5-10 seconds

**You don't need to do anything!**

**To check if service restarted:**
```bash
tail -f service-error.log  # See what caused the crash
```

---

### Scenario 5: Network Disconnects

**What happens:**
1. Service continues running locally
2. Can't fetch feeds from internet (no connection)
3. When network reconnects, service resumes normally
4. Next refresh cycle will work

**No action needed** - service handles network errors gracefully

---

## Verification After Restart

### Check if Service is Running:

```bash
# Method 1: Health check
curl http://localhost:8080/health

# Should return: {"status":"ok"}

# Method 2: Check process
ps aux | grep "node index.js"

# Should show the process running

# Method 3: Check launchd
launchctl list | grep rssfeed

# Should show service loaded
```

### Check Logs:

```bash
# Service logs
tail -20 service.log

# Error logs (if any issues)
tail -20 service-error.log

# Refresh logs
tail -20 refresh.log
```

---

## Auto-Start Setup (Required for Auto-Recovery)

The service **must** be set up with launchd to auto-start. If you haven't done this yet:

### Quick Setup:

1. **Create plist file** (see SETUP_ON_OTHER_COMPUTER.md)
2. **Load it:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
   ```
3. **Test restart:**
   ```bash
   # Stop service
   launchctl stop com.rssfeed.service
   
   # Start service (should work automatically on next boot)
   launchctl start com.rssfeed.service
   ```

---

## Cloudflare Tunnel After Restart

**If tunnel is set up with launchd:**
- ✅ Tunnel auto-starts with service
- ✅ URL stays the same (if using Cloudflare account)
- ✅ Everything works automatically

**If tunnel is NOT set up with launchd:**
- ⚠️ You'll need to manually start tunnel after restart
- ⚠️ URL may change (if using free trycloudflare.com)

**Solution:** Set up tunnel with launchd (see SETUP_ON_OTHER_COMPUTER.md)

---

## What Gets Lost on Restart?

### ✅ Preserved:
- Service code and configuration
- Cache files (if on disk)
- Log files
- Refresh state (`.refresh-state.json`)

### ⚠️ Lost (but regenerated):
- In-memory cache (rebuilds automatically)
- Active connections (reconnect automatically)
- Current scraping operations (restart on next cycle)

**Nothing important is lost!** Service rebuilds everything automatically.

---

## Testing Auto-Start

### Test 1: Manual Restart

1. Restart computer: Apple Menu → Restart
2. Wait for computer to boot (1-2 minutes)
3. Check service: `curl http://localhost:8080/health`
4. Should return: `{"status":"ok"}`

### Test 2: Simulate Crash

1. Stop service: `launchctl stop com.rssfeed.service`
2. Wait 5 seconds
3. Check if it restarted: `curl http://localhost:8080/health`
4. Should return: `{"status":"ok"}` (auto-restarted)

### Test 3: Check Logs After Restart

```bash
# Check when service started
grep "RSS Feed Service running" service.log | tail -1

# Should show recent timestamp (after restart)
```

---

## Troubleshooting: Service Doesn't Auto-Start

### Check 1: Is plist file correct?
```bash
cat ~/Library/LaunchAgents/com.rssfeed.service.plist
```

### Check 2: Is service loaded?
```bash
launchctl list | grep rssfeed
```

### Check 3: Check error logs
```bash
tail -50 service-error.log
```

### Fix: Reload service
```bash
launchctl unload ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl start com.rssfeed.service
```

---

## Summary

**✅ YES - Everything works automatically after restart!**

**What you need:**
- ✅ Set up launchd auto-start (one-time setup)
- ✅ Keep computer plugged in
- ✅ Set power settings (Computer sleep = Never)

**What happens:**
- ✅ Service starts automatically on boot
- ✅ Resumes normal operation
- ✅ Continues refreshing feeds
- ✅ No manual intervention needed

**You can safely:**
- ✅ Restart computer anytime
- ✅ Let it run 24/7
- ✅ Walk away and forget about it

**The service is designed to be "set it and forget it"!** 🚀

