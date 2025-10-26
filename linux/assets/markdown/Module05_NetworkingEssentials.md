# Module 5: Networking Essentials

## Overview

Networking is the backbone of modern computing. Whether you're managing servers, setting up remote access, or troubleshooting connectivity issues, understanding Linux networking is essential. This module covers everything from basic network configuration to advanced SSH tunneling and firewall management.

Linux provides powerful networking capabilities out of the box. You'll learn to configure network interfaces, diagnose connectivity problems, secure remote access with SSH, and protect systems with firewalls. These skills are fundamental for system administrators, DevOps engineers, and anyone working with Linux systems.

**What You'll Learn:**
- Network interface configuration (ip, ifconfig)
- IP addressing and subnetting
- Routing tables and gateway configuration
- DNS resolution and configuration
- Network diagnostic tools (ping, traceroute, netstat, ss)
- Port scanning and service detection
- SSH for secure remote access
- SSH key authentication
- Secure file transfer (scp, sftp, rsync)
- SSH tunneling and port forwarding
- Firewall configuration (UFW, iptables)
- Network security best practices

**Why This Matters:**
- Remote system administration requires SSH
- Network troubleshooting is a daily task
- Security depends on proper firewall configuration
- Automated deployments use secure file transfer
- Understanding networking is required for certifications
- Cloud infrastructure requires networking knowledge

---

## Table of Contents

### Week 7: Linux Networking
- [Day 24: Network Configuration](#day-24-network-configuration)
- [Day 25: Network Tools and Diagnostics](#day-25-network-tools-and-diagnostics)
- [Day 26: SSH and Remote Access](#day-26-ssh-and-remote-access)
- [Day 27: Firewall Basics](#day-27-firewall-basics)

---

## Week 7: Linux Networking

### Day 24: Network Configuration

Understanding how to view and configure network settings is fundamental to Linux system administration.

#### Understanding Network Interfaces

```bash
# ===== NETWORK INTERFACE BASICS =====

# Network interfaces are your computer's connection points:
# - Physical interfaces: eth0, eth1 (Ethernet)
# - Wireless interfaces: wlan0, wlan1 (WiFi)
# - Loopback interface: lo (localhost, 127.0.0.1)
# - Virtual interfaces: docker0, virbr0

# ===== VIEWING NETWORK INTERFACES (MODERN) =====

# Show all network interfaces and IP addresses
ip addr show
# OR shorthand:
ip a

# Output explained:
# 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
#     inet 127.0.0.1/8 scope host lo
# 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
#     inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0

# Key information:
# - Interface name (eth0, wlan0, etc.)
# - State (UP, DOWN)
# - MTU (Maximum Transmission Unit)
# - inet: IPv4 address
# - inet6: IPv6 address
# - Broadcast address
# - MAC address (link/ether)

# Show specific interface
ip addr show eth0
# OR:
ip a show eth0

# Show only IPv4 addresses
ip -4 addr show

# Show only IPv6 addresses
ip -6 addr show

# Brief output (just addresses)
ip -br addr show
# Compact view, one line per interface

# ===== VIEWING INTERFACES (LEGACY) =====

# Traditional ifconfig (may need net-tools package)
ifconfig
# Shows active interfaces

# All interfaces (including down)
ifconfig -a

# Specific interface
ifconfig eth0

# ifconfig output:
# eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
#         inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
#         inet6 fe80::...  prefixlen 64
#         ether 00:11:22:33:44:55  txqueuelen 1000

# ===== LINK LAYER (INTERFACE STATUS) =====

# Show link layer information
ip link show
# Shows: interface name, state, MTU, MAC address

# Output:
# 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
#     link/ether 00:11:22:33:44:55 brd ff:ff:ff:ff:ff:ff

# Interface flags:
# UP: interface is up
# BROADCAST: supports broadcast
# MULTICAST: supports multicast
# RUNNING: has carrier signal
# LOWER_UP: physical link is up

# Show statistics
ip -s link show eth0
# -s: statistics
# Shows packets, errors, drops

# Detailed statistics
ip -s -s link show eth0
# Double -s for more detail

# ===== BRINGING INTERFACES UP/DOWN =====

# Bring interface up
sudo ip link set eth0 up
# Activates interface

# Bring interface down
sudo ip link set eth0 down
# Deactivates interface

# Using ifconfig (legacy)
sudo ifconfig eth0 up
sudo ifconfig eth0 down

# ===== IP ADDRESS MANAGEMENT =====

# Add IP address to interface
sudo ip addr add 192.168.1.100/24 dev eth0
# Format: IP/prefix (CIDR notation)
# /24 = 255.255.255.0 netmask

# Add with broadcast
sudo ip addr add 192.168.1.100/24 broadcast 192.168.1.255 dev eth0

# Remove IP address
sudo ip addr del 192.168.1.100/24 dev eth0

# Multiple IPs on one interface (IP aliasing)
sudo ip addr add 192.168.1.101/24 dev eth0
sudo ip addr add 192.168.1.102/24 dev eth0
# Interface can have multiple IPs

# Legacy method (ifconfig)
sudo ifconfig eth0 192.168.1.100 netmask 255.255.255.0
# Sets IP and netmask

# ===== UNDERSTANDING CIDR NOTATION =====

# CIDR notation: IP/prefix
# /24 = 255.255.255.0    (254 hosts)
# /23 = 255.255.254.0    (510 hosts)
# /22 = 255.255.252.0    (1022 hosts)
# /16 = 255.255.0.0      (65534 hosts)
# /8  = 255.0.0.0        (16777214 hosts)

# Calculate network size:
# 32 - prefix = host bits
# 2^host_bits - 2 = usable hosts
# Example: /24 → 32-24=8 → 2^8-2=254 hosts

# Common private IP ranges:
# 10.0.0.0/8        (10.0.0.0 - 10.255.255.255)
# 172.16.0.0/12     (172.16.0.0 - 172.31.255.255)
# 192.168.0.0/16    (192.168.0.0 - 192.168.255.255)

# ===== CHANGING MAC ADDRESS =====

# View current MAC address
ip link show eth0 | grep link/ether

# Change MAC address (requires interface down)
sudo ip link set eth0 down
sudo ip link set eth0 address 00:11:22:33:44:55
sudo ip link set eth0 up

# Change MTU
sudo ip link set eth0 mtu 1400
# Useful for VPNs or specific networks
```

#### Routing Configuration

```bash
# ===== VIEWING ROUTING TABLE =====

# Show routing table (modern)
ip route show
# OR:
ip r

# Example output:
# default via 192.168.1.1 dev eth0 proto dhcp metric 100
# 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100

# Explanation:
# default via 192.168.1.1: default gateway
# dev eth0: outgoing interface
# 192.168.1.0/24: local network route
# src 192.168.1.100: source IP for this route

# Show IPv6 routes
ip -6 route show

# Legacy routing table
route -n
# -n: numeric (no DNS resolution)

# netstat routing table
netstat -rn
# -r: routing table
# -n: numeric

# ===== DEFAULT GATEWAY =====

# Add default gateway
sudo ip route add default via 192.168.1.1
# All traffic not matching other routes goes here

# Add default gateway with metric (priority)
sudo ip route add default via 192.168.1.1 metric 100
# Lower metric = higher priority

# Delete default gateway
sudo ip route del default

# Multiple default gateways (for redundancy)
sudo ip route add default via 192.168.1.1 metric 100
sudo ip route add default via 192.168.1.2 metric 200
# If first gateway fails, uses second

# ===== STATIC ROUTES =====

# Add route to specific network
sudo ip route add 10.0.0.0/8 via 192.168.1.1
# Traffic for 10.0.0.0/8 goes through 192.168.1.1

# Add route through specific interface
sudo ip route add 10.0.0.0/8 dev eth1
# Traffic for 10.0.0.0/8 goes out eth1

# Add route with source address
sudo ip route add 10.0.0.0/8 via 192.168.1.1 src 192.168.1.100

# Delete route
sudo ip route del 10.0.0.0/8

# Replace existing route
sudo ip route replace 10.0.0.0/8 via 192.168.1.2

# ===== ROUTING CACHE =====

# Flush routing cache
sudo ip route flush cache
# Forces recalculation of routes

# Show route to specific destination
ip route get 8.8.8.8
# Shows which route would be used

# Example output:
# 8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.100

# ===== LEGACY ROUTE COMMANDS =====

# Add default gateway (legacy)
sudo route add default gw 192.168.1.1

# Add network route (legacy)
sudo route add -net 10.0.0.0/8 gw 192.168.1.1

# Delete route (legacy)
sudo route del -net 10.0.0.0/8
```

#### DNS Configuration

```bash
# ===== DNS RESOLUTION FILES =====

# DNS servers configuration
cat /etc/resolv.conf
# Contains DNS nameserver addresses

# Example content:
# nameserver 8.8.8.8
# nameserver 8.8.4.4
# search example.com

# Explanation:
# nameserver: DNS server IP
# search: domain to append to unqualified hostnames

# ⚠️ /etc/resolv.conf often managed by:
# - NetworkManager
# - systemd-resolved
# - dhclient
# Manual changes may be overwritten!

# ===== LOCAL HOSTNAME RESOLUTION =====

# Local hosts file
cat /etc/hosts
# Static hostname-to-IP mapping
# Checked BEFORE DNS

# Example content:
# 127.0.0.1       localhost
# 127.0.1.1       mycomputer
# 192.168.1.100   server1.example.com server1
# 192.168.1.101   server2.example.com server2

# Format: IP  hostname [aliases]

# Add custom entry
echo "192.168.1.100 myserver" | sudo tee -a /etc/hosts

# Test hostname resolution
ping myserver
# Should resolve to 192.168.1.100

# ===== HOSTNAME CONFIGURATION =====

# View current hostname
hostname
# Shows system hostname

# Short hostname only
hostname -s

# Fully Qualified Domain Name (FQDN)
hostname -f
# Example: server1.example.com

# All configured names
hostname -A

# IP address of hostname
hostname -I

# Set hostname temporarily (until reboot)
sudo hostname newhostname
# Changes current session only

# Set hostname permanently (systemd)
sudo hostnamectl set-hostname newhostname
# Changes persist across reboots

# View hostname details
hostnamectl
# Shows: static, transient, and pretty hostname

# ===== SYSTEMD-RESOLVED (Modern DNS) =====

# Check if systemd-resolved is running
systemctl status systemd-resolved

# Check resolved configuration
resolvectl status
# Shows DNS servers per interface

# DNS statistics
resolvectl statistics
# Query counts and cache stats

# Flush DNS cache
sudo resolvectl flush-caches

# Query DNS through systemd-resolved
resolvectl query google.com

# ===== NETWORKMANAGER DNS =====

# NetworkManager configuration
cat /etc/NetworkManager/NetworkManager.conf

# DNS servers managed by NetworkManager
nmcli device show eth0 | grep DNS

# Set DNS manually with NetworkManager
nmcli con mod "Wired connection 1" ipv4.dns "8.8.8.8 8.8.4.4"
nmcli con up "Wired connection 1"

# ===== ORDER OF NAME RESOLUTION =====

# Resolution order controlled by:
cat /etc/nsswitch.conf
# Look for line: hosts: files dns

# Order matters:
# files: /etc/hosts
# dns: DNS servers in /etc/resolv.conf
# myhostname: systemd hostname
# mdns: multicast DNS (Avahi)

# Test resolution order
getent hosts google.com
# Uses nsswitch.conf order
```

#### Network Configuration Files

```bash
# ===== NETPLAN (Ubuntu 18.04+) =====

# Netplan configuration location
ls /etc/netplan/
# Usually: 01-network-manager-all.yaml or similar

# View configuration
cat /etc/netplan/*.yaml

# Example static IP configuration:
# network:
#   version: 2
#   renderer: networkd
#   ethernets:
#     eth0:
#       addresses: [192.168.1.100/24]
#       gateway4: 192.168.1.1
#       nameservers:
#         addresses: [8.8.8.8, 8.8.4.4]

# Example DHCP configuration:
# network:
#   version: 2
#   renderer: networkd
#   ethernets:
#     eth0:
#       dhcp4: yes

# Apply netplan changes
sudo netplan apply
# Applies configuration immediately

# Test configuration without applying
sudo netplan try
# Prompts to confirm changes
# Auto-reverts if no confirmation

# Generate backend configuration
sudo netplan generate
# Creates systemd-networkd or NetworkManager config

# Debug netplan
sudo netplan --debug generate
sudo netplan --debug apply

# ===== LEGACY INTERFACES FILE (Debian/Ubuntu) =====

# Legacy network configuration
cat /etc/network/interfaces

# Example static configuration:
# auto eth0
# iface eth0 inet static
#     address 192.168.1.100
#     netmask 255.255.255.0
#     gateway 192.168.1.1
#     dns-nameservers 8.8.8.8 8.8.4.4

# Example DHCP configuration:
# auto eth0
# iface eth0 inet dhcp

# Restart networking (legacy)
sudo /etc/init.d/networking restart
# OR:
sudo systemctl restart networking

# Bring interface up/down (legacy)
sudo ifup eth0
sudo ifdown eth0

# ===== NETWORKMANAGER =====

# NetworkManager command-line tool
nmcli
# Full featured network management

# Show all connections
nmcli connection show

# Show specific connection details
nmcli connection show "Wired connection 1"

# Show devices
nmcli device status

# Show device details
nmcli device show eth0

# Connect to connection
nmcli connection up "Wired connection 1"

# Disconnect
nmcli connection down "Wired connection 1"

# Create new connection (static IP)
nmcli con add type ethernet con-name "My Static" ifname eth0 \
  ip4 192.168.1.100/24 gw4 192.168.1.1

# Modify existing connection
nmcli con mod "Wired connection 1" ipv4.addresses 192.168.1.100/24
nmcli con mod "Wired connection 1" ipv4.gateway 192.168.1.1
nmcli con mod "Wired connection 1" ipv4.dns "8.8.8.8 8.8.4.4"
nmcli con mod "Wired connection 1" ipv4.method manual

# Switch to DHCP
nmcli con mod "Wired connection 1" ipv4.method auto

# Delete connection
nmcli con delete "Wired connection 1"

# ===== SYSTEMD-NETWORKD =====

# Configuration directory
ls /etc/systemd/network/

# Example configuration file: /etc/systemd/network/20-wired.network
# [Match]
# Name=eth0
#
# [Network]
# Address=192.168.1.100/24
# Gateway=192.168.1.1
# DNS=8.8.8.8
# DNS=8.8.4.4

# Restart systemd-networkd
sudo systemctl restart systemd-networkd

# Check status
sudo systemctl status systemd-networkd

# View networkd logs
journalctl -u systemd-networkd
```

#### Testing Network Connectivity

```bash
# ===== PING - Basic Connectivity Test =====

# Ping a host
ping google.com
# Sends ICMP echo requests
# Press Ctrl+C to stop

# Send specific number of packets
ping -c 4 google.com
# -c 4: count = 4 packets

# Output explained:
# 64 bytes from 142.250.185.46: icmp_seq=1 ttl=116 time=12.3 ms
#                                 ^sequence  ^TTL   ^round-trip time

# TTL (Time To Live): decremented by each router
# Low TTL may indicate routing loops

# Ping with interval
ping -i 0.5 google.com
# -i 0.5: 0.5 second interval (fast)

# Flood ping (requires root, testing only!)
sudo ping -f 192.168.1.1
# Sends packets as fast as possible
# ⚠️ Use only on your own networks!

# Ping with packet size
ping -s 1000 google.com
# -s 1000: 1000 byte packets
# Tests MTU and fragmentation

# Ping IPv6
ping6 google.com
# OR:
ping -6 google.com

# Ping broadcast (find devices on network)
ping -b 192.168.1.255
# Some systems block broadcast ping

# Quiet output (only summary)
ping -c 4 -q google.com
# -q: quiet mode

# Audible ping
ping -a google.com
# -a: beep for each reply

# Set source address
ping -I eth0 google.com
# -I: use specific interface/address

# ===== TRACEROUTE - Path Tracing =====

# Trace route to destination
traceroute google.com
# Shows each hop (router) to destination

# Output explained:
#  1  192.168.1.1 (192.168.1.1)  1.234 ms  1.123 ms  1.056 ms
#  2  10.0.0.1 (10.0.0.1)  5.678 ms  5.432 ms  5.234 ms
#  3  * * *  (timeout - no response)

# Each line shows:
# - Hop number
# - Hostname/IP
# - Three round-trip times

# Don't resolve hostnames (faster)
traceroute -n google.com
# -n: numeric output only

# Use ICMP instead of UDP
traceroute -I google.com
# -I: ICMP echo requests

# Specify maximum hops
traceroute -m 15 google.com
# -m 15: max 15 hops

# Set wait time per hop
traceroute -w 2 google.com
# -w 2: wait 2 seconds max per hop

# ===== TRACEPATH - Simpler Traceroute =====

# Alternative to traceroute (no root needed)
tracepath google.com
# Automatically discovers MTU

# With port
tracepath google.com:80

# ===== MTR - Combined Ping and Traceroute =====

# Best of ping + traceroute
mtr google.com
# Install: sudo apt install mtr

# Real-time statistics for each hop
# Shows: Loss%, Snt, Last, Avg, Best, Wrst, StDev

# Report mode (run and exit)
mtr -r -c 10 google.com
# -r: report mode
# -c 10: 10 cycles

# No DNS resolution
mtr -n google.com

# Wide report
mtr -w google.com
# Doesn't truncate hostnames

# ===== NETWORK INTERFACE STATISTICS =====

# Interface statistics
ip -s link show eth0
# Shows RX/TX packets, errors, drops

# Continuous monitoring
watch -n 1 'ip -s link show eth0'
# Updates every second

# Network statistics
netstat -i
# Interface statistics table

# Detailed statistics
netstat -s
# Protocol statistics

# Modern alternative
ss -s
# Socket statistics summary
```

---

#### Exercise 5.1: Network Configuration Practice

**Objective:** Master viewing and understanding network configuration.

1. **View Current Configuration:**
   - Display all network interfaces with `ip addr`
   - Identify your primary network interface
   - Note your IP address, subnet mask (prefix), and MAC address
   - Check if you have an IPv6 address

2. **Routing Information:**
   - View your routing table with `ip route`
   - Identify your default gateway
   - Note which interface is used for default route

3. **DNS Configuration:**
   - Check your DNS servers in `/etc/resolv.conf`
   - View your hostname with `hostname`
   - Check entries in `/etc/hosts`

4. **Connectivity Tests:**
   - Ping your default gateway
   - Ping Google's DNS (8.8.8.8)
   - Ping google.com (tests DNS resolution)
   - Traceroute to google.com

5. **Network Statistics:**
   - Check statistics for your primary interface
   - Look for any errors or dropped packets
   - Monitor real-time traffic with `ip -s link`

**Expected Results:**
- Complete understanding of your network configuration
- Ability to identify network components
- Successful connectivity tests
- Familiarity with network diagnostic commands

**Success Check:**
```bash
# Create network documentation
cat > my_network_config.txt << EOF
Primary Interface: $(ip -br addr show | grep UP | head -1 | awk '{print $1}')
IP Address: $(hostname -I | awk '{print $1}')
Gateway: $(ip route | grep default | awk '{print $3}')
DNS Servers: $(grep nameserver /etc/resolv.conf | awk '{print $2}' | tr '\n' ', ')
Hostname: $(hostname)
FQDN: $(hostname -f)
EOF

cat my_network_config.txt
```

---

#### Challenge 5.1: Network Documentation Script

**Objective:** Create a comprehensive network documentation tool.

Build a script that documents complete network configuration:

**Requirements:**

1. **Interface Information:**
   - List all network interfaces
   - For each interface show:
     - State (UP/DOWN)
     - IP address(es)
     - MAC address
     - MTU
     - RX/TX statistics

2. **Routing Information:**
   - Default gateway
   - All routes
   - Metric values

3. **DNS Configuration:**
   - DNS servers
   - Search domains
   - /etc/hosts entries

4. **Connectivity Tests:**
   - Ping gateway (success/fail)
   - Ping external IP (8.8.8.8)
   - Ping external domain (google.com)
   - DNS resolution test

5. **Output Format:**
   - Human-readable text report
   - Option for JSON output
   - Color-coded status (green/red)
   - Save to timestamped file

**Sample Output:**
```
╔═══════════════════════════════════════════════════╗
║        NETWORK CONFIGURATION REPORT              ║
║        Generated: 2024-01-15 14:30:00           ║
╚═══════════════════════════════════════════════════╝

INTERFACES:
  [✓] eth0: UP
      IP: 192.168.1.100/24
      MAC: 00:11:22:33:44:55
      MTU: 1500
      RX: 1.2 GB, TX: 856 MB

ROUTING:
  Default Gateway: 192.168.1.1 via eth0 [✓]
  
DNS:
  Nameservers: 8.8.8.8, 8.8.4.4
  Search: example.com

CONNECTIVITY:
  [✓] Gateway (192.168.1.1): 1.2ms
  [✓] Internet (8.8.8.8): 12.3ms
  [✓] DNS (google.com): 14.5ms

Report saved to: network_report_20240115_143000.txt
```

**Bonus Challenges:**
- Compare with previous reports (detect changes)
- Email report to administrator
- Alert on configuration changes
- HTML output option
- Integration with monitoring systems

---

### Day 25: Network Tools and Diagnostics

Advanced network diagnostic tools help you troubleshoot connectivity issues, scan ports, and analyze network traffic.

#### DNS Query Tools

```bash
# ===== NSLOOKUP - Basic DNS Lookup =====

# Simple lookup
nslookup google.com
# Returns IP address(es)

# Output:
# Server:         8.8.8.8
# Address:        8.8.8.8#53
#
# Non-authoritative answer:
# Name:   google.com
# Address: 142.250.185.46

# Reverse DNS lookup
nslookup 8.8.8.8
# Finds hostname from IP

# Query specific DNS server
nslookup google.com 8.8.8.8
# Use Google's DNS

# Interactive mode
nslookup
# > google.com
# > exit

# Specific record type
nslookup -type=mx google.com
# MX: mail exchange records

# ===== DIG - Detailed DNS Information =====

# Comprehensive DNS query
dig google.com
# Most detailed DNS tool

# Output sections:
# QUESTION: what was asked
# ANSWER: the response
# AUTHORITY: authoritative nameservers
# ADDITIONAL: additional information

# Short answer only
dig +short google.com
# Just the IP address

# Example: 142.250.185.46

# Specific record type
dig google.com A       # IPv4 address
dig google.com AAAA    # IPv6 address
dig google.com MX      # Mail servers
dig google.com NS      # Nameservers
dig google.com TXT     # Text records
dig google.com SOA     # Start of authority
dig google.com CNAME   # Canonical name

# Query specific DNS server
dig @8.8.8.8 google.com
# @ specifies DNS server

# Trace DNS resolution path
dig +trace google.com
# Shows resolution from root servers

# Reverse DNS lookup
dig -x 8.8.8.8
# PTR record lookup

# No recursion (ask server directly)
dig +norecurs google.com

# Show only answer section
dig +noall +answer google.com

# Multiple queries
dig google.com yahoo.com microsoft.com

# ===== HOST - Simple DNS Lookup =====

# Basic lookup
host google.com
# Simple, clean output

# Verbose output
host -v google.com
# More details

# Specific record type
host -t MX google.com
# Mail servers

# All records
host -a google.com
# Like dig ANY

# Reverse lookup
host 8.8.8.8

# Query specific server
host google.com 8.8.8.8

# ===== WHOIS - Domain Registration Info =====

# Domain registration information
whois google.com
# Registrar, dates, contacts

# IP address info
whois 8.8.8.8
# Network owner information
```

#### Port Scanning and Connection Testing

```bash
# ===== NETCAT (NC) - Swiss Army Knife =====

# Test if port is open
nc -zv google.com 80
# -z: scan mode (no data)
# -v: verbose

# Output if open:
# Connection to google.com 80 port [tcp/http] succeeded!

# Output if closed:
# nc: connect to google.com port 81 (tcp) failed: Connection refused

# Scan port range
nc -zv google.com 20-25
# Scans ports 20-25

# UDP port test
nc -zuv google.com 53
# -u: UDP mode

# Listen on port (server mode)
nc -l 12345
# Listens on port 12345
# Useful for testing connectivity

# Connect to listening port
nc localhost 12345
# Type messages, they appear on listener

# Transfer file over network
# Receiver:
nc -l 12345 > received_file.txt
# Sender:
nc receiver_ip 12345 < file_to_send.txt

# ===== TELNET - Connection Testing =====

# Test if port is open
telnet google.com 80
# Press Ctrl+] then "quit" to exit

# If connects: port is open
# If "Connection refused": port is closed
# If times out: port is filtered/blocked

# Test SMTP server
telnet smtp.gmail.com 25
# Can send SMTP commands

# Test HTTP manually
telnet google.com 80
# Then type:
# GET / HTTP/1.1
# Host: google.com
# [Press Enter twice]

# ===== NMAP - Network Scanner =====

# Scan localhost
nmap localhost
# Shows open ports

# Scan specific host
nmap 192.168.1.100

# Scan IP range
nmap 192.168.1.1-254
# Scans entire subnet

# Scan specific ports
nmap -p 80,443 192.168.1.100
# Only ports 80 and 443

# Scan port range
nmap -p 1-1000 192.168.1.100
# First 1000 ports

# Scan all ports
nmap -p- 192.168.1.100
# All 65535 ports (slow!)

# Service version detection
nmap -sV 192.168.1.100
# -sV: probe for service versions

# OS detection
sudo nmap -O 192.168.1.100
# -O: OS detection (requires root)

# Aggressive scan
sudo nmap -A 192.168.1.100
# -A: OS detection, version detection, script scanning

# Fast scan (top 100 ports)
nmap -F 192.168.1.100

# Scan types:
# -sT: TCP connect scan
# -sS: SYN stealth scan (requires root)
# -sU: UDP scan
# -sA: ACK scan

# Ping scan (find live hosts)
nmap -sn 192.168.1.0/24
# -sn: no port scan, just ping

# Output to file
nmap -oN scan_results.txt 192.168.1.100
# -oN: normal output

# ⚠️ Only scan networks you own or have permission!

# ===== CHECKING LISTENING PORTS =====

# Show listening ports (netstat)
sudo netstat -tulnp
# -t: TCP
# -u: UDP
# -l: listening
# -n: numeric (no DNS)
# -p: show program/PID

# Modern alternative (ss)
sudo ss -tulnp
# Same options, faster

# Example output:
# tcp   LISTEN  0  128  0.0.0.0:22    0.0.0.0:*  users:(("sshd",pid=1234,fd=3))
#  ^     ^      ^   ^      ^                         ^
# proto state  Recv-Q Send-Q  Local Address         Program

# Find what's using specific port
sudo lsof -i :80
# Shows process using port 80

# Find all network connections
sudo lsof -i
# All network files

# TCP connections only
sudo lsof -i tcp

# UDP connections only
sudo lsof -i udp

# Established connections
sudo lsof -i -sTCP:ESTABLISHED
```

#### Downloading Files

```bash
# ===== WGET - Download Files =====

# Download file
wget https://example.com/file.zip
# Saves to current directory

# Download with different name
wget -O newname.zip https://example.com/file.zip
# -O: output filename

# Download to specific directory
wget -P /tmp https://example.com/file.zip
# -P: prefix/directory

# Continue interrupted download
wget -c https://example.com/large_file.zip
# -c: continue

# Download multiple files
wget https://example.com/file1.zip https://example.com/file2.zip

# Download from file list
wget -i urls.txt
# urls.txt contains one URL per line

# Background download
wget -b https://example.com/file.zip
# Downloads in background
# Progress in wget-log

# Limit download speed
wget --limit-rate=1m https://example.com/file.zip
# Max 1 MB/s

# Download recursively (website mirroring)
wget -r -l 2 https://example.com/
# -r: recursive
# -l 2: depth of 2 levels

# ⚠️ Be respectful with recursive downloads!

# User agent string
wget --user-agent="Mozilla/5.0" https://example.com/file.zip

# HTTP authentication
wget --user=username --password=pass https://example.com/file.zip

# FTP download
wget ftp://ftp.example.com/file.zip

# Quiet mode
wget -q https://example.com/file.zip
# No output

# ===== CURL - Transfer Data =====

# Display webpage content
curl https://example.com
# Outputs to stdout

# Download file
curl -O https://example.com/file.zip
# -O: use remote filename

# Download with custom name
curl -o newname.zip https://example.com/file.zip
# -o: output filename

# Resume download
curl -C - -O https://example.com/large_file.zip
# -C -: continue from where it stopped

# Follow redirects
curl -L https://short.url
# -L: follow redirects (important!)

# Get HTTP headers only
curl -I https://example.com
# -I: head request only

# Verbose output (see request/response)
curl -v https://example.com

# Silent mode (no progress)
curl -s https://example.com

# POST request
curl -X POST -d "param1=value1" https://api.example.com

# POST JSON data
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"value"}' https://api.example.com

# Custom header
curl -H "Authorization: Bearer token123" https://api.example.com

# Upload file
curl -F "file=@/path/to/file" https://upload.example.com

# Basic authentication
curl -u username:password https://example.com

# Save cookies
curl -c cookies.txt https://example.com

# Use cookies
curl -b cookies.txt https://example.com

# Limit download rate
curl --limit-rate 1M -O https://example.com/file.zip

# Test API endpoint
curl -X GET https://api.example.com/users/1

# ===== PRACTICAL EXAMPLES =====

# Download and pipe to command
curl -s https://example.com/data.json | jq .
# Downloads and formats JSON

# Check if website is up
curl -s -o /dev/null -w "%{http_code}" https://example.com
# Returns HTTP status code

# Measure website response time
curl -w "@-" -o /dev/null -s https://example.com << 'EOF'
  time_total:  %{time_total}s\n
EOF

# Download latest GitHub release
curl -s https://api.github.com/repos/user/repo/releases/latest \
  | grep "browser_download_url" \
  | cut -d '"' -f 4 \
  | wget -i -
```

#### Network Statistics and Monitoring

```bash
# ===== NETSTAT - Network Statistics =====

# All connections and listening ports
netstat -a
# -a: all sockets

# Listening servers
netstat -l
# -l: listening

# TCP connections
netstat -t

# UDP connections
netstat -u

# Display PID and program names
sudo netstat -p
# -p: program (requires sudo for all processes)

# Numeric output (no DNS)
netstat -n

# Common combination
sudo netstat -tulnp
# TCP/UDP, listening, numeric, programs

# Routing table
netstat -r
# Same as 'route -n'

# Interface statistics
netstat -i
# Packets, errors per interface

# Protocol statistics
netstat -s
# Counts by protocol

# Continuous monitoring
netstat -c
# Updates continuously

# ===== SS - Socket Statistics (Modern Netstat) =====

# All sockets
ss -a

# Listening sockets
ss -l

# TCP sockets
ss -t

# UDP sockets
ss -u

# Process information
sudo ss -p

# Common usage
sudo ss -tulnp
# TCP/UDP, listening, numeric, processes

# Show only established
ss -t state established

# Filter by port
ss -tn sport = :22
# SSH connections

# Filter by destination
ss dst 192.168.1.100

# Summary statistics
ss -s
# Quick overview

# Memory usage
ss -m

# Extended info
ss -e

# Timer information
ss -o

# ===== IP STATISTICS =====

# Interface statistics
ip -s link show

# Routing cache statistics
ip -s route

# Neighbor (ARP) table
ip neigh show
# OR:
ip n

# ARP cache
arp -a
# Shows MAC-to-IP mappings

# ===== BANDWIDTH TESTING =====

# Internet speed test
speedtest-cli
# Install: sudo apt install speedtest-cli

# Simple version
speedtest-cli --simple
# Ping, download, upload speeds

# Share results
speedtest-cli --share
# Generates shareable image

# Network throughput test (iperf3)
# Server side:
iperf3 -s
# -s: server mode

# Client side:
iperf3 -c server_ip
# -c: client mode
# Tests TCP throughput

# UDP test
iperf3 -c server_ip -u
# -u: UDP mode

# Reverse direction
iperf3 -c server_ip -R
# -R: server to client

# ===== TCPDUMP - Packet Capture =====

# Capture packets on interface
sudo tcpdump -i eth0
# Displays packets in real-time

# Capture specific number
sudo tcpdump -c 100 -i eth0
# -c 100: capture 100 packets

# Save to file
sudo tcpdump -w capture.pcap -i eth0
# -w: write to file

# Read from file
tcpdump -r capture.pcap

# Filter by host
sudo tcpdump -i eth0 host 192.168.1.100
# Only traffic to/from this host

# Filter by port
sudo tcpdump -i eth0 port 80
# HTTP traffic only

# Filter by protocol
sudo tcpdump -i eth0 tcp
# TCP only

# Complex filters
sudo tcpdump -i eth0 'tcp port 80 and host 192.168.1.100'

# Show packet contents
sudo tcpdump -X -i eth0
# -X: hex and ASCII

# Don't resolve hostnames
sudo tcpdump -n -i eth0
# -n: numeric

# ⚠️ tcpdump captures sensitive data! Use carefully.
```

---

#### Exercise 5.2: Network Diagnostics Practice

**Objective:** Master network diagnostic and troubleshooting tools.

1. **DNS Resolution:**
   - Look up github.com with nslookup
   - Look up github.com with dig
   - Look up github.com with host
   - Compare the IP addresses returned
   - Perform a reverse DNS lookup on 8.8.8.8

2. **Port Scanning:**
   - Check which ports are listening on your system
   - Identify the process using port 22 (SSH)
   - Test if port 80 is open on google.com
   - Scan ports 20-25 on your system with nc

3. **File Download:**
   - Download a test file with wget
   - Download the same file with curl
   - Compare the two methods
   - Download a file and save with custom name

4. **Connection Testing:**
   - Test connection to google.com port 80 with telnet
   - Use netcat to test port 443 on google.com
   - Check your established connections with ss

5. **Network Statistics:**
   - View interface statistics
   - Check protocol statistics with netstat
   - Monitor new connections for 30 seconds

**Expected Results:**
- Comfort using various DNS tools
- Understanding of port scanning
- Ability to download files
- Experience with connection testing
- Skill in monitoring network activity

**Success Check:**
```bash
# Quick diagnostic
echo "=== DNS Test ===" && dig +short google.com
echo "=== Port Check ===" && sudo ss -tulnp | grep :22
echo "=== Connectivity ===" && ping -c 1 8.8.8.8 > /dev/null && echo "OK"
```

---

#### Challenge 5.2: Network Diagnostic Script

**Objective:** Create an automated network diagnostic tool.

Build a comprehensive network diagnostic script:

**Requirements:**

1. **Connectivity Tests:**
   - Ping default gateway (with latency)
   - Ping external IP (8.8.8.8)
   - Ping external domain (google.com)
   - Test DNS resolution speed

2. **Port Checks:**
   - List all listening ports
   - Identify services on common ports (22, 80, 443)
   - Test external connectivity on key ports
   - Check for unexpected open ports

3. **DNS Testing:**
   - Query multiple DNS servers
   - Compare response times
   - Verify DNS consistency
   - Test reverse DNS

4. **Service Availability:**
   - Check if key services are running
   - Test HTTP/HTTPS connectivity
   - Verify SSH accessibility
   - Check mail server ports

5. **Output:**
   - Color-coded results (green/yellow/red)
   - Performance metrics (latency, response times)
   - Warnings for issues found
   - Suggestions for problems

**Sample Output:**
```
╔════════════════════════════════════════════════╗
║     NETWORK DIAGNOSTIC TOOL v1.0              ║
║     Running diagnostics...                    ║
╚════════════════════════════════════════════════╝

[✓] Gateway (192.168.1.1): 1.2ms
[✓] Internet (8.8.8.8): 12.3ms  
[✓] DNS (google.com): 14.5ms
[✓] DNS Resolution: 45ms

LISTENING PORTS:
[✓] SSH (22): sshd (PID 1234)
[✓] HTTP (80): apache2 (PID 5678)
[!] WARNING: Port 23 (Telnet) open - Security Risk!

DNS SERVERS:
[✓] 8.8.8.8: 15ms
[✓] 8.8.4.4: 16ms
[!] Primary DNS slower than secondary

EXTERNAL SERVICES:
[✓] HTTP (port 80): Accessible
[✓] HTTPS (port 443): Accessible
[✓] SSH (port 22): Accessible

=== DIAGNOSTIC COMPLETE ===
Issues Found: 2
Run with -v for verbose output
```

**Bonus Challenges:**
- Automatic problem remediation
- Historical trending
- Email alerts for failures
- Integration with monitoring systems
- Network topology discovery
- Bandwidth testing
- Packet loss analysis

---

*Due to length, I'll now continue with Days 26-27 in the next section...*

---

### Day 26: SSH and Remote Access

SSH (Secure Shell) is the standard for secure remote access to Linux systems. Mastering SSH is essential for system administration.

#### SSH Basics

```bash
# ===== CONNECTING TO REMOTE SYSTEMS =====

# Basic SSH connection
ssh username@hostname
# Connects to remote system
# Prompts for password

# Using IP address
ssh username@192.168.1.100

# Specify port (if not default 22)
ssh -p 2222 username@hostname
# -p: port number

# Connect and run single command
ssh username@hostname "ls -la"
# Executes command and exits

# Multiple commands
ssh username@hostname "cd /var/log && ls -la"

# Run local script on remote
ssh username@hostname 'bash -s' < local_script.sh

# Interactive sudo on remote
ssh -t username@hostname "sudo command"
# -t: force pseudo-terminal allocation
# Needed for interactive sudo

# SSH with verbose output
ssh -v username@hostname
# -v: verbose (debugging)
# -vv: more verbose
# -vvv: maximum verbosity

# ===== SSH KEY AUTHENTICATION =====

# Generate SSH key pair
ssh-keygen
# Interactive prompts:
# - Where to save key (default: ~/.ssh/id_rsa)
# - Passphrase (recommended but optional)

# Generate RSA key with specific size
ssh-keygen -t rsa -b 4096
# -t: type (rsa, dsa, ecdsa, ed25519)
# -b: bits (2048, 4096)

# Generate Ed25519 key (modern, recommended)
ssh-keygen -t ed25519
# Ed25519 is faster and more secure

# Generate with comment
ssh-keygen -t ed25519 -C "my-laptop-key"
# -C: comment (usually email or description)

# Specify output file
ssh-keygen -t ed25519 -f ~/.ssh/id_work
# Creates specific key file

# Change key passphrase
ssh-keygen -p -f ~/.ssh/id_rsa
# -p: change passphrase

# View key fingerprint
ssh-keygen -lf ~/.ssh/id_rsa.pub
# -l: fingerprint
# -f: file

# ===== COPYING PUBLIC KEY TO SERVER =====

# Copy public key to server (easiest method)
ssh-copy-id username@hostname
# Automatically adds key to ~/.ssh/authorized_keys

# Specify key file
ssh-copy-id -i ~/.ssh/id_work.pub username@hostname

# Specify port
ssh-copy-id -p 2222 username@hostname

# Manual method (if ssh-copy-id not available)
cat ~/.ssh/id_rsa.pub | ssh username@hostname "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# After copying key, test connection
ssh username@hostname
# Should not prompt for password!

# ===== SSH CONFIG FILE =====

# Client configuration
nano ~/.ssh/config

# Example configuration:
# Host myserver
#     HostName 192.168.1.100
#     User myusername
#     Port 22
#     IdentityFile ~/.ssh/id_rsa
#     ServerAliveInterval 60
#     ServerAliveCountMax 3

# Then connect simply with:
ssh myserver

# Multiple server configs:
# Host web-server
#     HostName web.example.com
#     User webadmin
#     IdentityFile ~/.ssh/id_work
#
# Host db-server
#     HostName db.example.com
#     User dbadmin
#     IdentityFile ~/.ssh/id_work
#     Port 2222
#
# Host *.example.com
#     User defaultuser
#     IdentityFile ~/.ssh/id_company

# Wildcard matching:
# Host 192.168.1.*
#     User admin
#     IdentityFile ~/.ssh/id_local

# Set permissions correctly
chmod 600 ~/.ssh/config

# ===== SSH AGENT (Key Management) =====

# Start SSH agent
eval "$(ssh-agent -s)"
# Starts agent in current shell

# Add key to agent
ssh-add ~/.ssh/id_rsa
# Prompts for passphrase once

# Add key with timeout
ssh-add -t 3600 ~/.ssh/id_rsa
# -t: timeout in seconds
# Key removed after 1 hour

# List loaded keys
ssh-add -l

# Remove key from agent
ssh-add -d ~/.ssh/id_rsa

# Remove all keys
ssh-add -D

# ===== SSH OPTIONS =====

# Disable host key checking (⚠️ insecure!)
ssh -o StrictHostKeyChecking=no username@hostname
# Use only for automation/testing

# Connect with specific cipher
ssh -c aes256-ctr username@hostname

# Enable compression
ssh -C username@hostname
# -C: compression (good for slow connections)

# Bind to specific local address
ssh -b 192.168.1.50 username@hostname

# Forward X11 (GUI applications)
ssh -X username@hostname
# Run GUI apps remotely

# ===== SSH ESCAPE SEQUENCES =====

# While connected, special sequences:
# ~. : disconnect
# ~^Z : suspend ssh
# ~# : list forwarded connections
# ~& : background ssh (when waiting for forwarded connections)
# ~? : list escape sequences

# To use, press Enter first, then ~, then command
```

#### Secure File Transfer

```bash
# ===== SCP - Secure Copy =====

# Copy file to remote
scp file.txt username@hostname:/path/to/destination/
# Copies local file to remote

# Copy file from remote
scp username@hostname:/path/to/file.txt .
# Copies remote file to local

# Copy directory recursively
scp -r directory username@hostname:/path/
# -r: recursive (for directories)

# Specify port
scp -P 2222 file.txt username@hostname:/path/
# -P: port (UPPERCASE for scp!)

# Preserve file attributes
scp -p file.txt username@hostname:/path/
# -p: preserve modification times, access times, modes

# Verbose output
scp -v file.txt username@hostname:/path/

# Limit bandwidth
scp -l 1000 file.txt username@hostname:/path/
# -l: limit (Kbit/s)

# Copy between two remote hosts
scp user@host1:/path/file user@host2:/path/
# You act as intermediary

# Use specific key
scp -i ~/.ssh/id_work file.txt username@hostname:/path/

# ===== SFTP - Secure FTP =====

# Start SFTP session
sftp username@hostname

# SFTP commands:
# ls              # List remote directory
# lls             # List local directory
# cd path         # Change remote directory
# lcd path        # Change local directory
# pwd             # Print remote working directory
# lpwd            # Print local working directory
# get file        # Download file
# put file        # Upload file
# get -r dir      # Download directory recursively
# put -r dir      # Upload directory recursively
# rm file         # Delete remote file
# rmdir dir       # Remove remote directory
# mkdir dir       # Create remote directory
# rename old new  # Rename remote file
# !command        # Execute local shell command
# help            # Show help
# exit            # Quit SFTP

# SFTP with specific port
sftp -P 2222 username@hostname

# SFTP batch mode (non-interactive)
sftp -b commands.txt username@hostname

# commands.txt example:
# cd /var/www/html
# put index.html
# chmod 644 index.html
# bye

# ===== RSYNC - Efficient File Synchronization =====

# Sync directory to remote
rsync -avz source/ username@hostname:/path/dest/
# -a: archive mode (recursive, preserves permissions, etc.)
# -v: verbose
# -z: compress during transfer

# Sync from remote to local
rsync -avz username@hostname:/path/source/ ./dest/

# Delete files in dest that don't exist in source
rsync -avz --delete source/ username@hostname:/path/dest/
# --delete: remove extra files in destination

# Dry run (see what would be transferred)
rsync -avzn source/ username@hostname:/path/dest/
# -n: dry run (no changes)

# Show progress
rsync -avz --progress source/ username@hostname:/path/dest/

# Exclude files/directories
rsync -avz --exclude='*.log' --exclude='temp/' source/ username@hostname:/path/dest/

# Exclude from file
rsync -avz --exclude-from='exclude.txt' source/ username@hostname:/path/dest/

# Include only specific files
rsync -avz --include='*.txt' --exclude='*' source/ username@hostname:/path/dest/

# Limit bandwidth
rsync -avz --bwlimit=1000 source/ username@hostname:/path/dest/
# Limit: KB/s

# Use specific SSH port
rsync -avz -e "ssh -p 2222" source/ username@hostname:/path/dest/

# Resume interrupted transfer
rsync -avz --partial source/ username@hostname:/path/dest/
# --partial: keep partially transferred files

# Show only differences
rsync -avzn --itemize-changes source/ username@hostname:/path/dest/

# Backup mode (keep old files)
rsync -avz --backup --backup-dir=/path/to/backup source/ username@hostname:/path/dest/

# Common rsync use cases:

# Mirror directory (exact copy)
rsync -avz --delete source/ dest/

# Backup with dated directory
rsync -avz source/ backup/$(date +%Y%m%d)/

# Incremental backup with hard links
rsync -avz --link-dest=../previous source/ new/
# Unchanged files are hard-linked to previous backup

# Sync only newer files
rsync -avzu source/ dest/
# -u: update (skip newer files in destination)
```

#### SSH Tunneling and Port Forwarding

```bash
# ===== LOCAL PORT FORWARDING =====

# Forward local port to remote service
ssh -L 8080:localhost:80 username@hostname
# -L local_port:destination_host:destination_port

# Explanation:
# - Opens port 8080 on your machine
# - Connects to hostname via SSH
# - Forwards to port 80 on hostname
# Access: http://localhost:8080

# Access remote MySQL through tunnel
ssh -L 3306:localhost:3306 username@dbserver
# Then connect: mysql -h 127.0.0.1 -u user -p

# Forward to different host through SSH server
ssh -L 8080:192.168.1.100:80 username@gateway
# Accesses 192.168.1.100:80 through gateway

# Multiple port forwards
ssh -L 8080:localhost:80 -L 3306:localhost:3306 username@hostname

# Run in background
ssh -fN -L 8080:localhost:80 username@hostname
# -f: background
# -N: no remote command (just forwarding)

# ===== REMOTE PORT FORWARDING =====

# Forward remote port to local service
ssh -R 8080:localhost:80 username@hostname
# -R remote_port:destination_host:destination_port

# Explanation:
# - Opens port 8080 on remote hostname
# - Connections to hostname:8080
# - Forwarded to localhost:80 (your machine)

# Share local web server
ssh -R 8080:localhost:8000 username@publicserver
# Others can access: http://publicserver:8080

# Reverse tunnel for remote access
ssh -R 2222:localhost:22 username@publicserver
# From publicserver: ssh -p 2222 localhost
# Connects back to your machine!

# ===== DYNAMIC PORT FORWARDING (SOCKS Proxy) =====

# Create SOCKS proxy
ssh -D 1080 username@hostname
# -D: dynamic forwarding
# Creates SOCKS proxy on localhost:1080

# Configure browser/app to use:
# SOCKS Host: localhost
# Port: 1080

# All traffic goes through SSH tunnel
# Useful for:
# - Bypassing firewalls
# - Securing public WiFi
# - Accessing internal networks

# Background SOCKS proxy
ssh -fN -D 1080 username@hostname

# ===== PRACTICAL TUNNELING EXAMPLES =====

# Access RDP through SSH tunnel
ssh -L 3389:windows-machine:3389 username@gateway
# Then connect RDP to localhost:3389

# Create permanent tunnel with autossh
autossh -M 0 -f -N -L 8080:localhost:80 username@hostname
# Automatically reconnects if dropped

# Tunnel through multiple hops
ssh -L 8080:localhost:80 jump-host \
  ssh -L 80:final-dest:80 username@intermediate
# Creates path through intermediate hosts
```

#### SSH Security Best Practices

```bash
# ===== SECURE SSH SERVER =====

# SSH server configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# Port 22                          # Or custom port
# PermitRootLogin no               # Disable root login
# PasswordAuthentication yes       # Enable (or no after setting up keys)
# PubkeyAuthentication yes         # Enable key auth
# PermitEmptyPasswords no          # Disable empty passwords
# MaxAuthTries 3                   # Limit login attempts
# ClientAliveInterval 300          # Timeout idle connections
# ClientAliveCountMax 2
# AllowUsers user1 user2           # Whitelist users
# DenyUsers baduser                # Blacklist users
# Protocol 2                       # Use SSH protocol 2

# Restart SSH after changes
sudo systemctl restart sshd

# ===== KEY PERMISSIONS =====

# Correct permissions are CRITICAL

# Private key
chmod 600 ~/.ssh/id_rsa
# Only owner can read/write

# Public key
chmod 644 ~/.ssh/id_rsa.pub
# Owner read/write, others read

# .ssh directory
chmod 700 ~/.ssh
# Only owner access

# authorized_keys file
chmod 600 ~/.ssh/authorized_keys

# Known hosts
chmod 644 ~/.ssh/known_hosts

# Config file
chmod 600 ~/.ssh/config

# ===== MANAGING KNOWN_HOSTS =====

# Known hosts file
cat ~/.ssh/known_hosts
# Stores server fingerprints

# Remove host from known_hosts
ssh-keygen -R hostname
# Removes entry for hostname

# Clear all known hosts
rm ~/.ssh/known_hosts

# Add host to known hosts
ssh-keyscan hostname >> ~/.ssh/known_hosts

# ===== CONNECTION ISSUES =====

# Debug connection problems
ssh -vvv username@hostname
# Triple verbose shows everything

# Test specific cipher
ssh -c aes256-ctr username@hostname

# Test without key
ssh -o PubkeyAuthentication=no username@hostname

# Check server logs
sudo tail -f /var/log/auth.log
# Shows SSH attempts

# ===== SSH SECURITY TIPS =====

# 1. Use key authentication, disable passwords
# 2. Use strong passphrases on keys
# 3. Use ssh-agent to avoid typing passphrase repeatedly
# 4. Change default SSH port
# 5. Disable root login
# 6. Use fail2ban to block brute force attacks
# 7. Limit user access with AllowUsers/DenyUsers
# 8. Keep SSH updated
# 9. Use two-factor authentication if possible
# 10. Monitor SSH logs regularly
```

---

#### Exercise 5.3: SSH Mastery Practice

**Objective:** Master SSH connections and secure file transfer.

1. **Basic SSH:**
   - Generate a new SSH key pair
   - Copy your public key to a remote system (use two VMs or Raspberry Pi)
   - Connect via SSH without password
   - Run a command remotely without logging in

2. **SSH Configuration:**
   - Create ~/.ssh/config with an alias
   - Test connection using alias
   - Add multiple host entries
   - Use different keys for different hosts

3. **File Transfer:**
   - Copy a file to remote system using scp
   - Copy a directory recursively
   - Start an sftp session and navigate directories
   - Sync a directory using rsync

4. **Advanced SSH:**
   - Create a local port forward
   - Test the port forward works
   - Try a dynamic SOCKS proxy
   - Run a local script on remote system

5. **Security:**
   - Check your key permissions
   - View known_hosts file
   - Change your key passphrase
   - Test SSH with verbose output

**Expected Results:**
- Passwordless SSH authentication
- Configured SSH client
- Comfortable with file transfer methods
- Understanding of port forwarding
- Proper security practices

**Success Check:**
```bash
# Verify setup
echo "Keys: $(ls ~/.ssh/*.pub | wc -l)"
echo "Config: $([ -f ~/.ssh/config ] && echo 'Exists' || echo 'Missing')"
echo "Agent: $(ssh-add -l 2>/dev/null && echo 'Running' || echo 'Not running')"
```

---

#### Challenge 5.3: Automated Backup System

**Objective:** Build an automated backup system using SSH and rsync.

Create a backup solution that:

**Requirements:**

1. **Configuration:**
   - Config file with backup sources and destinations
   - Multiple backup profiles
   - SSH key-based authentication
   - No password prompts

2. **Backup Features:**
   - Incremental backups using rsync
   - Hard-linked snapshots (like Time Machine)
   - Compression during transfer
   - Exclude patterns
   - Bandwidth limiting option

3. **Automation:**
   - Daily backup via cron
   - Retention policy (keep 7 daily, 4 weekly, 12 monthly)
   - Automatic cleanup of old backups
   - Pre/post backup hooks

4. **Monitoring:**
   - Log all backup operations
   - Email on success/failure
   - Backup size reporting
   - Verify backup integrity

5. **Recovery:**
   - Easy restore script
   - List available backups
   - Restore specific files
   - Full system restore option

**Sample Config:**
```bash
# backup.conf
SOURCE="/home/user/important"
DEST="backupserver:/backups/$(hostname)"
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=12
EXCLUDE=(*.tmp cache/ .git/)
SSH_KEY="~/.ssh/backup_key"
```

**Usage:**
```bash
./backup.sh               # Run backup now
./backup.sh --restore     # Interactive restore
./backup.sh --list        # List backups
./backup.sh --verify      # Verify latest backup
```

**Bonus Challenges:**
- Encrypt backups
- Support multiple destinations
- Parallel backup jobs
- Database backup integration
- Bandwidth throttling
- Resume interrupted backups
- Backup comparison tool

---

### Day 27: Firewall Basics

Firewalls control network traffic, protecting your system from unauthorized access. Linux provides powerful firewall capabilities.

#### UFW - Uncomplicated Firewall

```bash
# ===== UFW BASICS =====

# UFW is a user-friendly frontend for iptables
# Default on Ubuntu

# Check UFW status
sudo ufw status
# Shows: Status, Rules

# Enable UFW
sudo ufw enable
# Starts firewall and enables on boot

# Disable UFW
sudo ufw disable
# Stops firewall

# Reset UFW (remove all rules)
sudo ufw reset
# Confirms before resetting

# ===== BASIC RULES =====

# Allow port
sudo ufw allow 22
# Allows both TCP and UDP on port 22

# Allow specific protocol
sudo ufw allow 80/tcp
# Only TCP on port 80

sudo ufw allow 53/udp
# Only UDP on port 53

# Allow port range
sudo ufw allow 6000:6007/tcp
# Ports 6000-6007 TCP

# Deny port
sudo ufw deny 23
# Blocks telnet

# Delete rule
sudo ufw delete allow 80
# Removes the allow rule

# ===== ADVANCED RULES =====

# Allow from specific IP
sudo ufw allow from 192.168.1.100
# All traffic from this IP

# Allow from subnet
sudo ufw allow from 192.168.1.0/24
# Entire subnet

# Allow specific IP to specific port
sudo ufw allow from 192.168.1.100 to any port 22
# Only this IP can SSH

# Deny from IP
sudo ufw deny from 203.0.113.0/24

# Allow specific interface
sudo ufw allow in on eth0 to any port 80

# Allow between specific IPs
sudo ufw allow from 192.168.1.100 to 192.168.1.200

# ===== APPLICATION PROFILES =====

# List available applications
sudo ufw app list
# Shows profiles like 'OpenSSH', 'Apache', etc.

# Show application details
sudo ufw app info 'OpenSSH'
# Ports and description

# Allow application
sudo ufw allow 'OpenSSH'
# Uses predefined profile

# Common applications:
sudo ufw allow 'Apache'          # HTTP only
sudo ufw allow 'Apache Full'     # HTTP and HTTPS
sudo ufw allow 'Apache Secure'   # HTTPS only
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'

# ===== MANAGING RULES =====

# Show numbered rules
sudo ufw status numbered
# Lists rules with numbers

# Delete by number
sudo ufw delete 2
# Removes rule number 2

# Insert rule at position
sudo ufw insert 1 allow from 192.168.1.100
# Inserts as first rule

# ===== DEFAULT POLICIES =====

# Set default incoming policy
sudo ufw default deny incoming
# Deny all incoming by default

# Set default outgoing policy
sudo ufw default allow outgoing
# Allow all outgoing by default

# Set default forwarding policy
sudo ufw default deny routed
# Deny all forwarded traffic

# ===== LOGGING =====

# Enable logging
sudo ufw logging on

# Set logging level
sudo ufw logging low
# Levels: off, low, medium, high, full

# View UFW logs
sudo tail -f /var/log/ufw.log

# ===== RATE LIMITING =====

# Limit connections (prevent brute force)
sudo ufw limit 22/tcp
# Max 6 connections per 30 seconds from same IP

# ===== IPV6 =====

# Enable IPv6
sudo nano /etc/default/ufw
# Set IPV6=yes

sudo ufw disable && sudo ufw enable
# Restart for changes

# ===== PRACTICAL EXAMPLES =====

# Web server setup
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# SSH from home only
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw deny 22

# Database server (local only)
sudo ufw allow from 127.0.0.1 to any port 3306
sudo ufw deny 3306

# Mail server
sudo ufw allow 25/tcp   # SMTP
sudo ufw allow 587/tcp  # SMTP submission
sudo ufw allow 993/tcp  # IMAPS
sudo ufw allow 995/tcp  # POP3S
```

#### iptables - Advanced Firewall

```bash
# ===== IPTABLES BASICS =====

# iptables is the low-level firewall system
# More complex but more powerful than UFW

# List all rules
sudo iptables -L
# Shows all chains and rules

# List with more details
sudo iptables -L -v -n
# -v: verbose (packet/byte counts)
# -n: numeric (no DNS resolution)

# List specific chain
sudo iptables -L INPUT -v -n

# ===== CHAINS =====

# Three main chains:
# INPUT   - incoming packets to system
# OUTPUT  - outgoing packets from system
# FORWARD - packets routed through system

# ===== TARGETS =====

# Common targets:
# ACCEPT  - allow packet
# DROP    - silently discard packet
# REJECT  - discard and send error
# LOG     - log packet

# ===== BASIC RULES =====

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT
# -A: append rule
# -i: input interface
# -j: jump to target (ACCEPT)

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# -m state: use state module
# Allows return traffic

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# -p: protocol
# --dport: destination port

# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow from specific IP
sudo iptables -A INPUT -s 192.168.1.100 -j ACCEPT
# -s: source IP

# Allow from subnet
sudo iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT

# Allow to specific destination
sudo iptables -A INPUT -d 192.168.1.200 -j ACCEPT
# -d: destination

# Drop all other input
sudo iptables -A INPUT -j DROP

# ===== DELETING RULES =====

# Delete by specification
sudo iptables -D INPUT -p tcp --dport 80 -j ACCEPT
# -D: delete

# Delete by number
sudo iptables -L INPUT --line-numbers
sudo iptables -D INPUT 3
# Deletes rule 3 in INPUT chain

# ===== INSERTING RULES =====

# Insert at beginning
sudo iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT
# -I: insert at position 1

# ===== FLUSHING RULES =====

# Flush all rules
sudo iptables -F
# -F: flush (removes all rules)

# Flush specific chain
sudo iptables -F INPUT

# ===== DEFAULT POLICIES =====

# Set default policy
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT
# -P: policy

# ===== SAVING AND RESTORING =====

# Save rules (Ubuntu/Debian)
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6

# Restore rules
sudo iptables-restore < /etc/iptables/rules.v4

# Make persistent (Ubuntu)
sudo apt install iptables-persistent
# Rules saved automatically

# Update persistent rules
sudo netfilter-persistent save

# ===== ADVANCED RULES =====

# Rate limiting (prevent DDoS)
sudo iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# Block invalid packets
sudo iptables -A INPUT -m state --state INVALID -j DROP

# Log dropped packets
sudo iptables -A INPUT -j LOG --log-prefix "iptables DROP: "
sudo iptables -A INPUT -j DROP

# Allow ping (ICMP)
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Block ping
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j DROP

# Allow multicast
sudo iptables -A INPUT -d 224.0.0.0/4 -j ACCEPT

# ===== NAT (Network Address Translation) =====

# Port forwarding
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
# Redirects port 80 to 8080

# Masquerading (share internet)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# -t nat: NAT table

# ===== COMPLETE FIREWALL SCRIPT =====

#!/bin/bash
# Basic firewall script

# Flush existing rules
iptables -F
iptables -X
iptables -Z

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -m state --state NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m state --state NEW -j ACCEPT

# Allow ping
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Log dropped packets
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables denied: " --log-level 7

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "Firewall configured"
```

#### Monitoring and Troubleshooting

```bash
# ===== MONITORING FIREWALL =====

# Watch UFW in real-time
sudo tail -f /var/log/ufw.log

# Watch iptables logs
sudo tail -f /var/log/kern.log | grep iptables

# Count dropped packets
sudo iptables -L -v -n | grep DROP

# Zero packet counters
sudo iptables -Z

# ===== TESTING FIREWALL =====

# Test from remote
# On remote machine:
telnet your_server 80
nc -zv your_server 80
nmap your_server

# Test locally
sudo iptables -L -v -n
# Check packet counts

# Temporary test rule
sudo ufw allow from 1.2.3.4
# Test, then:
sudo ufw delete allow from 1.2.3.4

# ===== TROUBLESHOOTING =====

# Can't access service after enabling firewall:
# 1. Check if service is running
sudo systemctl status servicename

# 2. Check if firewall is blocking
sudo ufw status
sudo iptables -L -n

# 3. Check if service is listening
sudo ss -tulnp | grep port

# 4. Temporarily disable firewall to test
sudo ufw disable
# Test connection
sudo ufw enable

# Connection refused vs timeout:
# - Refused: service not running or actively rejecting
# - Timeout: firewall dropping packets

# ===== SECURITY BEST PRACTICES =====

# 1. Default deny policy
# 2. Only allow necessary ports
# 3. Use rate limiting for SSH
# 4. Allow SSH from specific IPs when possible
# 5. Enable logging
# 6. Regularly review rules
# 7. Test changes before applying
# 8. Document firewall rules
# 9. Use UFW for simplicity, iptables for advanced needs
# 10. Keep firewall enabled and updated
```

---

#### Exercise 5.4: Firewall Configuration

**Objective:** Master firewall configuration and security.

1. **UFW Setup:**
   - Check UFW status
   - Enable UFW
   - Allow SSH (port 22)
   - Allow HTTP and HTTPS
   - Test that SSH still works

2. **Rule Management:**
   - View current rules (numbered)
   - Add a rule to allow from specific IP
   - Delete a rule
   - Set default policies

3. **Application Profiles:**
   - List available application profiles
   - Allow 'OpenSSH' profile
   - Check application info

4. **Testing:**
   - Scan your ports from another machine
   - Verify only allowed ports are open
   - Test rejected connections
   - Check firewall logs

5. **Advanced Rules:**
   - Create rate limit rule for SSH
   - Allow specific subnet
   - Deny specific IP
   - Test all rules work correctly

**Expected Results:**
- Working firewall configuration
- Understanding of default policies
- Ability to add/remove rules
- Successful testing of rules
- Secure system with minimal exposure

**Success Check:**
```bash
# Verify firewall
sudo ufw status numbered
nmap localhost
sudo tail -20 /var/log/ufw.log
```

---

#### Challenge 5.4: Comprehensive Firewall Setup

**Objective:** Configure a complete firewall solution for a web server.

Set up a production-grade firewall:

**Requirements:**

1. **Web Server Protection:**
   - Allow HTTP (80) and HTTPS (443) from anywhere
   - Allow SSH (22) only from specific admin IPs
   - Rate-limit SSH to prevent brute force
   - Block all other incoming traffic

2. **Database Security:**
   - Allow MySQL (3306) only from web server IP
   - Deny all other MySQL access
   - Same for Redis/PostgreSQL if needed

3. **Monitoring & Logging:**
   - Enable comprehensive logging
   - Log all dropped packets
   - Create log analysis script
   - Alert on suspicious activity

4. **Documentation:**
   - Document all rules and their purpose
   - Create rule management scripts
   - Backup firewall configuration
   - Create restore procedure

5. **Testing:**
   - Port scan from external IP
   - Test legitimate access
   - Test blocked access
   - Verify logs are working

**Sample Configuration:**
```bash
# web_server_firewall.sh
#!/bin/bash

# Flush rules
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw default deny routed

# Admin SSH access only
sudo ufw allow from 203.0.113.100 to any port 22 comment 'Admin Office'
sudo ufw limit 22/tcp comment 'Rate limit SSH'

# Web traffic
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow localhost MySQL
sudo ufw allow from 127.0.0.1 to any port 3306

# Allow webserver subnet MySQL
sudo ufw allow from 192.168.1.0/24 to any port 3306 comment 'Internal DB access'

# Enable logging
sudo ufw logging medium

# Enable firewall
sudo ufw --force enable

echo "Firewall configured successfully"
sudo ufw status numbered
```

**Bonus Challenges:**
- Geo-blocking (block by country)
- DDoS protection rules
- Automatic fail2ban integration
- IPv6 rules
- VPN configuration
- Load balancer rules
- Container network isolation
- Intrusion detection integration

---

## Module Summary

Congratulations! You've completed Module 5 and mastered Linux networking essentials!

### Key Skills Acquired

✅ **Network Configuration**
- Viewing and configuring network interfaces
- IP address management
- Routing table configuration
- DNS setup and troubleshooting
- Hostname management
- Network configuration files (netplan, interfaces, NetworkManager)

✅ **Network Diagnostics**
- DNS query tools (nslookup, dig, host)
- Connectivity testing (ping, traceroute, mtr)
- Port scanning (nc, telnet, nmap)
- Connection monitoring (netstat, ss, lsof)
- File downloading (wget, curl)
- Packet capture (tcpdump)

✅ **SSH and Remote Access**
- SSH client usage
- SSH key generation and management
- Key-based authentication
- SSH config file
- Secure file transfer (scp, sftp, rsync)
- SSH tunneling and port forwarding
- SSH security best practices

✅ **Firewall Management**
- UFW configuration
- iptables fundamentals
- Rule creation and management
- Application profiles
- Logging and monitoring
- Security best practices

### Essential Commands Learned

**Network Configuration:**
- `ip addr`, `ip link`, `ip route`, `ifconfig`, `route`, `hostname`, `hostnamectl`, `nmcli`

**Diagnostics:**
- `ping`, `traceroute`, `mtr`, `nslookup`, `dig`, `host`, `nc`, `telnet`, `nmap`, `netstat`, `ss`, `lsof`, `wget`, `curl`, `tcpdump`

**SSH:**
- `ssh`, `ssh-keygen`, `ssh-copy-id`, `ssh-add`, `ssh-agent`, `scp`, `sftp`, `rsync`

**Firewall:**
- `ufw`, `iptables`, `iptables-save`, `iptables-restore`

### Security Takeaways

- Always use SSH key authentication
- Protect private keys with passphrases
- Configure firewalls on all systems
- Use default deny policies
- Rate-limit sensitive services
- Monitor firewall logs regularly
- Keep SSH updated
- Disable root SSH login
- Use non-standard SSH ports when appropriate
- Implement fail2ban for brute force protection

### Best Practices Learned

1. Use modern tools (ip over ifconfig, ss over netstat)
2. Always test connectivity before and after firewall changes
3. Document network configuration
4. Use SSH config files for convenience
5. Implement principle of least privilege in firewall rules
6. Enable firewall logging
7. Regular security audits
8. Automate repetitive network tasks
9. Use rsync for efficient file synchronization
10. Test backups regularly

### What's Next?

In **Module 6: Package Management & Software**, you'll learn:
- APT package management
- Installing and removing software
- Repository management
- Package compilation from source
- Snap and Flatpak
- Software troubleshooting
- System updates and upgrades

---

## Final Notes

Networking is fundamental to modern Linux administration. The skills you've learned form the foundation for:
- Remote server management
- Cloud infrastructure
- DevOps practices
- Security implementation
- System integration
- Troubleshooting

**Remember:**
- Network security is critical
- Document your configurations
- Test changes in safe environments first
- Monitor your systems regularly
- Keep software updated
- Implement defense in depth
- Regular backups before major changes

**Resources:**
- `man ip`, `man ssh`, `man iptables`
- Linux Network Administrator's Guide
- SSH Mastery by Michael W. Lucas
- Practical Packet Analysis by Chris Sanders

---

*End of Module 5*

**When you're ready to continue, please review this module and provide your feedback. Then say "continue" to proceed to Module 6: Package Management & Software.**