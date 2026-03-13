# Lab 00: Complete Lab Environment Setup

## Objective

Set up a complete, isolated malware analysis lab environment suitable for all course modules.

## Prerequisites

- Computer with at least 16GB RAM (32GB recommended)
- 100GB free disk space
- Virtualization enabled in BIOS (Intel VT-x or AMD-V)
- Internet connection for initial setup

## Time Required

2-4 hours (downloads + configuration)

---

## Part 1: Install Virtualization Software

### Option A: VirtualBox (Recommended for Beginners)

**Pros**: Free, cross-platform, easy to use
**Cons**: Slightly lower performance than VMware

**Installation**:

```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install virtualbox virtualbox-ext-pack

# macOS
brew install --cask virtualbox

# Windows
# Download from: https://www.virtualbox.org/wiki/Downloads
# Install VirtualBox-x.x.x-Win.exe
```

**Verify Installation**:
```bash
VBoxManage --version
# Expected: 7.0.x or higher
```

### Option B: VMware Workstation/Fusion

**Pros**: Better performance, more features
**Cons**: Commercial (free Player/Fusion Player available)

**Installation**:
```bash
# Download VMware Workstation Player (Windows/Linux - Free)
# https://www.vmware.com/products/workstation-player.html

# Download VMware Fusion Player (macOS - Free for personal use)
# https://www.vmware.com/products/fusion.html
```

---

## Part 2: Download Analysis VMs

### REMnux (Linux-based Analysis)

**Purpose**: Linux malware analysis, scripting, forensics tools

**Download**:
```bash
# Option 1: Pre-built OVA (Recommended)
# Visit: https://docs.remnux.org/install-distro/get-virtual-appliance
wget https://[remnux-url]/remnux-v7-focal.ova

# Import into VirtualBox
VBoxManage import remnux-v7-focal.ova \
  --vsys 0 \
  --vmname REMnux \
  --memory 4096 \
  --cpus 2

# Option 2: Install on Ubuntu VM (Advanced)
# Create Ubuntu 20.04/22.04 VM, then:
wget https://REMnux.org/remnux-cli
chmod +x remnux-cli
sudo ./remnux-cli install
```

**Default Credentials**:
- Username: `remnux`
- Password: `malware`

**Resources**:
- RAM: 4GB minimum, 8GB recommended
- Disk: 60GB
- Network: Host-only adapter

### FLARE-VM (Windows-based Analysis)

**Purpose**: Windows malware analysis, debugging, reverse engineering

**Installation** (requires Windows 10/11 VM):

1. **Create Windows VM**:
   - Download Windows 10 Evaluation: https://www.microsoft.com/en-us/evalcenter/
   - Create VM with:
     - RAM: 8GB minimum
     - Disk: 80GB
     - Network: Host-only initially

2. **Install FLARE-VM**:
   ```powershell
   # Inside Windows VM (run as Administrator)
   
   # Disable Windows Defender temporarily
   Set-MpPreference -DisableRealtimeMonitoring $true
   
   # Install Chocolatey
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
   
   # Download and install FLARE-VM
   (New-Object net.webclient).DownloadFile('https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1',"$([Environment]::GetFolderPath("Desktop"))\install.ps1")
   
   # Run installer (will take 2-3 hours)
   Unblock-File .\Desktop\install.ps1
   .\Desktop\install.ps1
   
   # Follow prompts, reboot when complete
   ```

**Resources**:
- RAM: 8GB minimum, 16GB recommended
- Disk: 80GB
- Network: Host-only adapter

---

## Part 3: Network Configuration

### Create Host-Only Network (VirtualBox)

**Purpose**: VMs can communicate with each other and host, but NOT the internet.

```bash
# Create host-only network
VBoxManage hostonlyif create

# Configure network (Linux/Mac)
VBoxManage hostonlyif ipconfig vboxnet0 --ip 192.168.56.1 --netmask 255.255.255.0

# Windows (use GUI)
# File → Host Network Manager → Create
# Set adapter IP: 192.168.56.1/24
```

**Assign to VMs**:
```bash
# REMnux
VBoxManage modifyvm "REMnux" --nic1 hostonly --hostonlyadapter1 vboxnet0

# FLARE-VM
VBoxManage modifyvm "FLARE-VM" --nic1 hostonly --hostonlyadapter1 vboxnet0
```

### Verify Isolation

**On REMnux**:
```bash
# Check IP configuration
ip addr show
# Should see: 192.168.56.x

# Test internet is blocked
ping -c 3 8.8.8.8
# Should fail: Network is unreachable

# Test host connectivity
ping -c 3 192.168.56.1
# Should succeed
```

**On FLARE-VM**:
```powershell
# Check IP
ipconfig
# Should see: 192.168.56.x

# Test internet blocked
Test-Connection 8.8.8.8 -Count 3
# Should fail

# Test host connectivity
Test-Connection 192.168.56.1 -Count 3
# Should succeed
```

---

## Part 4: Configure Victim VMs

### Windows 10 Victim VM

**Purpose**: Clean Windows system for dynamic analysis (gets "infected" with safe samples)

**Setup**:
1. Create new VM:
   - Name: Windows10-Victim
   - RAM: 4GB
   - Disk: 60GB
   - Network: Host-only (192.168.56.0/24)

2. Install Windows 10 (use evaluation ISO)

3. Configure:
   ```powershell
   # Disable Windows Defender (for analysis purposes)
   Set-MpPreference -DisableRealtimeMonitoring $true
   Set-MpPreference -DisableIOAVProtection $true
   Set-MpPreference -DisableBehaviorMonitoring $true
   Set-MpPreference -DisableBlockAtFirstSeen $true
   
   # Disable Windows Firewall (for analysis)
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
   
   # Enable file extensions
   $key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
   Set-ItemProperty $key HideFileExt 0
   
   # Show hidden files
   Set-ItemProperty $key Hidden 1
   ```

4. Take clean snapshot:
   ```bash
   VBoxManage snapshot "Windows10-Victim" take "CleanBaseline" \
     --description "Fresh Windows 10, Defender off, ready for analysis"
   ```

### Linux Victim VM (Optional)

**Purpose**: Analyze Linux malware and scripts

**Quick Setup**:
```bash
# Download Ubuntu Server (lightweight)
wget https://releases.ubuntu.com/22.04/ubuntu-22.04-live-server-amd64.iso

# Create VM
VBoxManage createvm --name "Ubuntu-Victim" --ostype Ubuntu_64 --register
VBoxManage modifyvm "Ubuntu-Victim" --memory 2048 --cpus 1 --nic1 hostonly --hostonlyadapter1 vboxnet0
VBoxManage createhd --filename ~/VirtualBox\ VMs/Ubuntu-Victim/Ubuntu-Victim.vdi --size 20000
VBoxManage storagectl "Ubuntu-Victim" --name "SATA" --add sata --controller IntelAHCI
VBoxManage storageattach "Ubuntu-Victim" --storagectl "SATA" --port 0 --device 0 --type hdd --medium ~/VirtualBox\ VMs/Ubuntu-Victim/Ubuntu-Victim.vdi
VBoxManage storageattach "Ubuntu-Victim" --storagectl "SATA" --port 1 --device 0 --type dvddrive --medium ubuntu-22.04-live-server-amd64.iso

# Install, then snapshot
VBoxManage snapshot "Ubuntu-Victim" take "CleanBaseline"
```

---

## Part 5: Install Analysis Tools

### On REMnux (Pre-installed, verify)

```bash
# Update REMnux
sudo apt update && sudo apt upgrade -y

# Verify key tools
strings --version
file --version
xxd -v
python3 --version
yara --version
volatility --version

# Install additional tools if needed
sudo apt install -y \
  radare2 \
  binwalk \
  upx \
  ssdeep \
  python3-pip

pip3 install pefile
```

### On FLARE-VM (Pre-installed, verify)

Open PowerShell as Administrator:
```powershell
# Verify installations
Get-Command ghidra
Get-Command x64dbg
Get-Command pestudio
Get-Command procmon

# List all FLARE tools
choco list --local-only | Select-String "flare"
```

### Shared Folder Setup (for file transfer)

**VirtualBox**:
```bash
# Create shared folder on host
mkdir ~/malware-analysis-shared

# Add to VM
VBoxManage sharedfolder add "REMnux" \
  --name "shared" \
  --hostpath ~/malware-analysis-shared \
  --automount

# Mount in REMnux
sudo mkdir /mnt/shared
sudo mount -t vboxsf shared /mnt/shared

# Make permanent (add to /etc/fstab)
echo "shared /mnt/shared vboxsf defaults 0 0" | sudo tee -a /etc/fstab
```

---

## Part 6: Snapshot Strategy

### Snapshot Best Practices

```bash
# Take clean "golden" snapshots
VBoxManage snapshot "REMnux" take "Golden-Clean"
VBoxManage snapshot "FLARE-VM" take "Golden-Clean"
VBoxManage snapshot "Windows10-Victim" take "Golden-Clean"

# Before each analysis session, restore
VBoxManage snapshot "Windows10-Victim" restore "Golden-Clean"

# After analysis, take forensic snapshot (optional)
VBoxManage snapshot "Windows10-Victim" take "Post-Analysis-Lab01"
```

### Snapshot Management Script

```bash
#!/bin/bash
# save as: restore_victim.sh

VM_NAME="Windows10-Victim"
SNAPSHOT="Golden-Clean"

echo "[*] Restoring $VM_NAME to $SNAPSHOT..."

# Power off if running
VBoxManage controlvm "$VM_NAME" poweroff 2>/dev/null

# Wait a moment
sleep 2

# Restore snapshot
VBoxManage snapshot "$VM_NAME" restore "$SNAPSHOT"

echo "[+] Restored. Ready for new analysis."
echo "[*] Start VM with: VBoxManage startvm '$VM_NAME'"
```

---

## Part 7: Verification Checklist

Before proceeding to Module 01, verify:

- [ ] VirtualBox/VMware installed and functional
- [ ] REMnux VM running, can access tools
- [ ] FLARE-VM installed with analysis tools
- [ ] At least one victim VM (Windows10-Victim)
- [ ] Host-only network configured (192.168.56.0/24)
- [ ] VMs isolated (no internet access)
- [ ] VMs can ping host (192.168.56.1)
- [ ] Golden snapshots created for all VMs
- [ ] Shared folder working (optional but helpful)
- [ ] Can restore victim VM from snapshot

---

## Part 8: Quick Start Commands

### Starting Analysis Session

```bash
# 1. Restore victim to clean state
VBoxManage snapshot "Windows10-Victim" restore "Golden-Clean"

# 2. Start VMs
VBoxManage startvm "REMnux" --type headless  # or gui
VBoxManage startvm "Windows10-Victim"

# 3. Transfer sample (via shared folder or SCP)
# From host:
cp eicar.com ~/malware-analysis-shared/

# From REMnux:
ls /mnt/shared/
```

### Ending Analysis Session

```bash
# 1. Document findings

# 2. Save forensic snapshot (optional)
VBoxManage snapshot "Windows10-Victim" take "Lab-01-Complete"

# 3. Shutdown VMs
VBoxManage controlvm "Windows10-Victim" poweroff
VBoxManage controlvm "REMnux" acpipowerbutton

# 4. Restore for next session
VBoxManage snapshot "Windows10-Victim" restore "Golden-Clean"
```

---

## Troubleshooting

### Issue: VM won't start

```bash
# Check VM status
VBoxManage list vms
VBoxManage showvminfo "REMnux" | grep State

# Reset VM
VBoxManage controlvm "REMnux" poweroff
VBoxManage startvm "REMnux"
```

### Issue: Network not working

```bash
# Verify host-only adapter exists
VBoxManage list hostonlyifs

# Recreate if needed
VBoxManage hostonlyif remove vboxnet0
VBoxManage hostonlyif create
VBoxManage hostonlyif ipconfig vboxnet0 --ip 192.168.56.1
```

### Issue: Low performance

- Increase RAM allocation
- Enable nested virtualization (if supported)
- Use SSD for VM storage
- Close unnecessary applications on host

---

## Summary

You now have:
- ✅ Isolated analysis environment
- ✅ REMnux (Linux analysis VM)
- ✅ FLARE-VM (Windows analysis VM)
- ✅ Victim VM for dynamic analysis
- ✅ Proper network isolation
- ✅ Snapshot strategy for safe testing

**Next**: Proceed to [Module 01 - Foundations](../modules/01_foundations.md)

---

## Additional Resources

- [REMnux Documentation](https://docs.remnux.org/)
- [FLARE-VM GitHub](https://github.com/mandiant/flare-vm)
- [VirtualBox Manual](https://www.virtualbox.org/manual/)
- [VMware Documentation](https://docs.vmware.com/)
