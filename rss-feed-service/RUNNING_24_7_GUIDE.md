# Running RSS Feed Service 24/7 on MacBook Pro (2015)

## Your Computer Specs
- **Model**: MacBook Pro Retina 13-inch Early 2015
- **OS**: macOS Catalina 10.15.7
- **RAM**: 8 GB
- **CPU**: 2.7 GHz Dual Core Intel Core i5
- **Storage**: 60 GB available of 121.12 GB

## ✅ Is It Safe? YES!

**Short answer: Your computer will be fine. The RSS feed service is very lightweight.**

### Resource Usage:

**RSS Feed Service:**
- **Memory**: ~50-150 MB (very light)
- **CPU**: <5% when idle, ~10-20% when scraping
- **Disk**: Minimal (just logs and cache)
- **Network**: Low bandwidth

**Your MacBook can easily handle this:**
- ✅ 8 GB RAM is plenty (service uses <200 MB)
- ✅ Dual core i5 is more than enough
- ✅ 60 GB free space is sufficient
- ✅ 2015 MacBook Pro is well-built for 24/7 operation

---

## Best Practices for 24/7 Operation

### 1. **Keep It Plugged In** ⚡

**IMPORTANT**: Always keep the MacBook plugged into power when running 24/7.

**Why:**
- Prevents battery wear from constant charging/discharging
- Ensures consistent performance
- Prevents unexpected shutdowns

**Battery Settings:**
- Go to System Preferences → Energy Saver
- Uncheck "Put hard disks to sleep when possible"
- Set "Computer sleep" to "Never" (or 3+ hours)
- Set "Display sleep" to your preference (can sleep display, keep computer on)

### 2. **Ventilation** 🌬️

**Keep it cool:**
- Place on a hard, flat surface (not bed/couch)
- Use a laptop stand if possible (improves airflow)
- Keep vents clear of dust
- Room temperature: Normal room temp is fine (65-75°F)

**Your MacBook will:**
- ✅ Automatically throttle if it gets too hot
- ✅ Fans will spin up if needed
- ✅ Built-in thermal protection prevents damage

**Signs of overheating (rare):**
- Fan running loudly constantly
- Computer feels very hot to touch
- Performance slows down

**If this happens:**
- Clean the vents (compressed air)
- Check Activity Monitor for other processes
- Ensure good ventilation

### 3. **System Updates** 🔄

**Handle updates carefully:**
- macOS updates may require restart
- Set up auto-restart for the service (see below)
- Or schedule updates during low-usage times

**Prevent auto-updates from interrupting:**
```bash
# Disable auto-updates (optional)
sudo softwareupdate --schedule off
```

### 4. **Disk Space** 💾

**Monitor disk space:**
- Service logs: ~10-50 MB/month
- Cache files: ~100-500 MB
- You have 60 GB free - plenty of space

**Clean up logs periodically:**
```bash
# Rotate logs monthly
cd rss-feed-service
# Keep last 30 days of logs
find . -name "*.log" -mtime +30 -delete
```

### 5. **Auto-Restart on Reboot** 🔄

**Set up service to auto-start:**
- Use launchd (see RUNNING_LOCALLY.md)
- Service will restart automatically after:
  - System updates
  - Power outages (if on UPS)
  - Manual restarts

### 6. **Monitor Health** 📊

**Check system health occasionally:**

```bash
# Check CPU/Memory usage
top -l 1 | grep -E "CPU|PhysMem"

# Check disk space
df -h

# Check service is running
ps aux | grep "node index.js"

# Check service logs
tail -f rss-feed-service/service.log
```

---

## Expected Resource Usage

### Idle (no requests):
- **CPU**: 0-2%
- **Memory**: 50-100 MB
- **Network**: 0 KB/s
- **Disk**: Minimal

### Active (scraping feeds):
- **CPU**: 10-30% (spikes during scraping)
- **Memory**: 100-200 MB
- **Network**: 1-5 MB/s (during scraping)
- **Disk**: Logs written (~1-5 MB/day)

### Peak (refreshing all feeds):
- **CPU**: 30-50% (brief spikes)
- **Memory**: 200-300 MB
- **Network**: 5-10 MB/s
- **Disk**: Minimal

**Your MacBook handles this easily!**

---

## Will It Overheat? NO

**Why it won't overheat:**

1. **Lightweight workload**: RSS service is very light
2. **Built-in protection**: MacBook has thermal throttling
3. **Good ventilation**: Retina MacBook Pro has good cooling
4. **Idle most of the time**: Service is idle 95% of the time

**Normal operation:**
- Service runs every 15 minutes (checks which feeds need refresh)
- Actual scraping happens every 3 hours for most feeds
- Most of the time, service is just waiting (0% CPU)

**Comparison:**
- Streaming video: 30-50% CPU constantly
- Web browsing: 10-20% CPU
- **RSS service**: 0-5% CPU most of the time

---

## Will It Crash? UNLIKELY

**Stability:**

1. **Node.js is stable**: Very reliable for long-running processes
2. **Express is battle-tested**: Used by millions of sites
3. **Error handling**: Service has try/catch blocks
4. **Auto-restart**: Can set up to restart on crash

**Potential issues (rare):**
- Memory leak (unlikely with current code)
- Network issues (service handles gracefully)
- System updates (can auto-restart)

**Prevention:**
- Monitor logs weekly
- Set up auto-restart with launchd
- Keep macOS updated (security patches)

---

## Will It Die? NO (Normal Wear)

**Normal wear:**
- ✅ Running 24/7 is fine for MacBooks
- ✅ Your 2015 model is well-built
- ✅ Light workload won't stress components

**What wears out (over years):**
- Battery (if not plugged in) - **Keep it plugged in!**
- Hard drive (SSD in your case - very reliable)
- Fans (may need cleaning after years)

**Expected lifespan:**
- MacBook Pro 2015: Can easily run 5-10+ more years
- Running 24/7: Adds minimal wear (light workload)
- SSD: Lasts 10+ years with normal use

---

## Recommended Setup

### 1. **Power Settings**
```
System Preferences → Energy Saver:
- Computer sleep: Never (or 3+ hours)
- Display sleep: 15 minutes (saves screen)
- Put hard disks to sleep: OFF
- Prevent automatic sleep on power adapter: ON
```

### 2. **Auto-Start Service**
Use launchd to auto-start (see RUNNING_LOCALLY.md)

### 3. **Monitor Temperature** (Optional)
```bash
# Install temperature monitor
brew install osx-cpu-temp

# Check temperature
osx-cpu-temp
```

**Normal temps:**
- Idle: 40-50°C (104-122°F)
- Under load: 60-80°C (140-176°F)
- **Your service**: Will stay in idle range most of the time

### 4. **Keep It Clean**
- Clean vents every 6-12 months (compressed air)
- Keep on hard surface
- Ensure good airflow

---

## Comparison: What's Harder on Your MacBook

**Easier than RSS service:**
- ✅ Streaming Netflix (higher CPU/GPU)
- ✅ Video editing (much higher CPU)
- ✅ Gaming (much higher CPU/GPU)
- ✅ Running multiple apps (more memory)

**Similar to RSS service:**
- ✅ Running a web server
- ✅ File sharing
- ✅ Background tasks

**Your RSS service is one of the lightest workloads possible!**

---

## Troubleshooting

### If Computer Gets Hot:
1. Check Activity Monitor for other processes
2. Clean vents with compressed air
3. Ensure good ventilation
4. Check if service is stuck in a loop (check logs)

### If Service Stops:
1. Check logs: `tail -f rss-feed-service/service.log`
2. Check if Node.js crashed: `ps aux | grep node`
3. Restart service: `launchctl start com.rssfeed.service`

### If Computer Restarts:
1. Service will auto-start (if using launchd)
2. Check logs after restart
3. Verify service is running: `curl http://localhost:8080/health`

---

## Final Verdict

**✅ YES, it's completely safe to run 24/7**

Your MacBook Pro 2015 is:
- ✅ Well-built and reliable
- ✅ More than capable of handling this workload
- ✅ Designed for continuous operation
- ✅ Has built-in thermal protection

**Just remember:**
- Keep it plugged in
- Ensure good ventilation
- Set up auto-restart
- Monitor occasionally (weekly is fine)

**Your computer will be fine!** This is a very light workload that won't stress your hardware.

---

## Quick Setup Checklist

- [ ] Keep MacBook plugged into power
- [ ] Set Energy Saver: Computer sleep = Never
- [ ] Place on hard, flat surface
- [ ] Set up auto-start with launchd
- [ ] Test service: `curl http://localhost:8080/health`
- [ ] Set up Cloudflare Tunnel for public access
- [ ] Monitor logs first week, then weekly

**You're all set!** Your MacBook will handle this easily. 🚀

