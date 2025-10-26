# Module 2: File System & Permissions

## Overview

The Linux file system is organized in a hierarchical structure, and everything in Linux is treated as a file. Understanding this structure and the permission system is fundamental to system administration and security.

In this module, you'll learn how Linux organizes files, how permissions control access to resources, and how to navigate and manipulate the file system safely and effectively. The Linux permission system is one of its greatest strengths—it provides fine-grained control over who can access what, making Linux inherently secure.

**What You'll Learn:**
- The Linux file system hierarchy and what each directory contains
- How to read and interpret file permissions
- How to change permissions using both numeric and symbolic modes
- Understanding file ownership (users and groups)
- Special permissions and their use cases
- The difference between hard links and symbolic links
- Advanced file searching techniques
- File attributes and extended permissions

**Why This Matters:**
- Permissions are the foundation of Linux security
- Understanding the file system prevents accidental damage
- Proper permission management protects sensitive data
- These skills are essential for system administration
- Every Linux certification exam tests permission knowledge

---

## Table of Contents

### Week 3: Understanding Linux File System
- [Day 8: File System Hierarchy](#day-8-file-system-hierarchy)
- [Day 9: File Permissions - Part 1](#day-9-file-permissions---part-1)
- [Day 10: File Permissions - Part 2](#day-10-file-permissions---part-2)
- [Day 11: Links and File Types](#day-11-links-and-file-types)
- [Day 12: Finding Files and Advanced Searching](#day-12-finding-files-and-advanced-searching)

---

## Week 3: Understanding Linux File System

### Day 8: File System Hierarchy

Linux uses a single hierarchical directory structure, unlike Windows which uses drive letters (C:, D:, etc.). Everything starts from the root directory `/` and branches out from there. Understanding this structure is crucial for navigating and administering Linux systems.

#### The Root Directory and Major Subdirectories

```bash
# View the root directory contents
ls /
# Shows all top-level directories in the file system
# This is the starting point of everything in Linux

# View detailed information about root directory
ls -la /
# Shows hidden files and detailed permissions
# Notice that / is owned by root and has restricted permissions
```

**Understanding the Filesystem Hierarchy Standard (FHS):**

The Linux file system follows the Filesystem Hierarchy Standard, which defines the purpose of each directory. Here's what each major directory contains:

```bash
# ===== ESSENTIAL SYSTEM DIRECTORIES =====

# /bin - Essential command binaries
ls /bin
# Contains fundamental commands needed in single-user mode
# Examples: ls, cp, mv, rm, cat, bash, grep
# These commands must be available even when /usr is not mounted
# All users can execute these programs

# /boot - Boot loader files
ls /boot
# Contains the Linux kernel, initial RAM disk image (initrd)
# Boot loader configuration files (GRUB)
# CRITICAL: Don't delete anything here or system won't boot!
# Typically a separate partition for safety

# /dev - Device files
ls /dev
# Every hardware device is represented as a file here
# Examples:
#   /dev/sda - first hard drive
#   /dev/sda1 - first partition on first drive
#   /dev/null - discards all data written to it
#   /dev/random - provides random data
#   /dev/tty - terminal devices
# These are special files that interface with kernel drivers

# /etc - System configuration files
ls /etc
# Contains system-wide configuration files
# Examples:
#   /etc/passwd - user account information
#   /etc/group - group information
#   /etc/hosts - hostname to IP mappings
#   /etc/fstab - filesystem mount configuration
#   /etc/ssh/ - SSH server configuration
# Text files that can be edited to configure system behavior
# Requires root privileges to modify most files

# ===== USER DIRECTORIES =====

# /home - User home directories
ls /home
# Each user gets a subdirectory here
# Example: /home/john, /home/jane
# Users have full control over their home directories
# Personal files, configurations, documents stored here
# Think of it as "My Documents" in Windows

# /root - Root user's home directory
sudo ls /root
# Home directory for the superuser (root)
# Separate from /home for security and recovery reasons
# Located at / level so it's accessible even if /home fails
# Requires root privileges to access

# ===== SYSTEM BINARY DIRECTORIES =====

# /sbin - System binaries
ls /sbin
# Essential system administration commands
# Examples: fdisk, mkfs, iptables, reboot, shutdown
# Typically requires root privileges to execute
# Used for system maintenance and configuration

# /usr - User programs (Unix System Resources)
ls /usr
# Contains majority of user applications and utilities
# Subdirectories:
#   /usr/bin - User commands (most of your programs)
#   /usr/sbin - System administration commands
#   /usr/lib - Libraries for /usr/bin and /usr/sbin
#   /usr/local - Locally installed software (not from package manager)
#   /usr/share - Shared data (documentation, icons, etc.)
# Can be network-mounted or on separate partition

# /usr/local - Locally installed software
ls /usr/local
# Software you compile and install yourself goes here
# Mirrors /usr structure: /usr/local/bin, /usr/local/lib, etc.
# Keeps locally installed software separate from distribution packages
# Won't be overwritten by system updates

# ===== LIBRARY DIRECTORIES =====

# /lib - Essential shared libraries
ls /lib
# Shared libraries required by programs in /bin and /sbin
# Similar to DLL files in Windows
# Critical for system boot

# ===== TEMPORARY AND VARIABLE DIRECTORIES =====

# /tmp - Temporary files
ls /tmp
# Temporary files created by applications and users
# Usually cleared on reboot (distribution dependent)
# World-writable directory (anyone can create files)
# Has sticky bit set for security (more on this later)
# Don't store anything important here!

# /var - Variable data
ls /var
# Contains files that are expected to grow or change
# Subdirectories:
#   /var/log - Log files (system and application logs)
#   /var/mail - User mailboxes
#   /var/spool - Spool files (print queues, scheduled jobs)
#   /var/tmp - Temporary files (persists between reboots)
#   /var/www - Web server files (on web servers)
# Frequently monitored by administrators

# ===== MOUNT DIRECTORIES =====

# /mnt - Temporary mount points
ls /mnt
# Traditionally used for temporarily mounted filesystems
# Example: mounting external USB drives manually
# Empty by default

# /media - Removable media
ls /media
# Automatic mount points for removable devices
# When you plug in a USB drive, it typically appears here
# Example: /media/username/USB_DRIVE

# ===== OPTIONAL DIRECTORIES =====

# /opt - Optional software packages
ls /opt
# Third-party software packages
# Self-contained applications that don't fit /usr structure
# Example: /opt/google/chrome
# Some commercial software installs here

# /srv - Service data
ls /srv
# Data for services provided by the system
# Example: /srv/http for web server, /srv/ftp for FTP
# Not widely used in all distributions

# ===== VIRTUAL/SPECIAL DIRECTORIES =====

# /proc - Process information (virtual filesystem)
ls /proc
# Virtual filesystem providing process and kernel information
# Contains information about running processes
# Each process has a directory named by its PID
# Examples:
#   /proc/cpuinfo - CPU information
#   /proc/meminfo - Memory information
#   /proc/version - Kernel version
# These are not real files on disk!

cat /proc/cpuinfo
# Shows detailed CPU information
# This is dynamically generated by the kernel

cat /proc/meminfo
# Shows detailed memory usage information
# Updates in real-time

# /sys - Sysfs filesystem (virtual)
ls /sys
# Virtual filesystem for device and kernel information
# More structured than /proc
# Used by kernel to export information about devices
# Modern replacement for some /proc functionality

# /run - Runtime data
ls /run
# Runtime data for programs
# Information about the running system since last boot
# PIDs, socket files, lock files
# Stored in RAM (tmpfs) for speed
# Cleared on reboot
```

#### Exploring Important Configuration Files

```bash
# View OS information
cat /etc/os-release
# Contains distribution-specific information
# Shows: name, version, ID, pretty name
# Example output:
# NAME="Ubuntu"
# VERSION="22.04 LTS (Jammy Jellyfish)"
# ID=ubuntu

# View system hostname
cat /etc/hostname
# Contains the system's hostname
# One line file with just the hostname

# View hosts file (DNS overrides)
cat /etc/hosts
# Maps hostnames to IP addresses
# Checked before DNS queries
# Format: IP_ADDRESS  HOSTNAME  ALIASES
# Example:
# 127.0.0.1  localhost
# 192.168.1.100  raspberrypi

# View user accounts (safe to view, don't edit directly)
cat /etc/passwd
# Contains user account information
# Format: username:x:UID:GID:comment:home:shell
# Example: john:x:1000:1000:John Doe:/home/john:/bin/bash
# The 'x' means password is in /etc/shadow
# Not actually containing passwords (despite the name!)

# View group information
cat /etc/group
# Contains group definitions
# Format: groupname:x:GID:members
# Example: developers:x:1001:john,jane

# View filesystem mount configuration
cat /etc/fstab
# Defines which filesystems are mounted at boot
# Critical file - mistakes here can prevent booting
# Format: device  mountpoint  filesystem  options  dump  pass

# View system logs
sudo tail -20 /var/log/syslog
# Recent system log entries
# Useful for troubleshooting
# Requires sudo on most systems

# View authentication logs
sudo tail -20 /var/log/auth.log
# Shows login attempts, sudo usage, authentication events
# Critical for security auditing
```

#### Navigating the Filesystem Effectively

```bash
# Use 'tree' command for visual representation
sudo apt install tree -y    # Install if not present
tree -L 2 /etc
# Shows directory structure as a tree
# -L 2 limits depth to 2 levels
# Great for understanding organization

# Find how much space directories use
du -sh /var/log
# -s: summary (total only)
# -h: human-readable format
# Shows total size of /var/log directory

# Show disk usage of subdirectories
du -h --max-depth=1 /var | sort -hr
# Shows size of each subdirectory in /var
# Sorted by size (largest first)
# Useful for finding space hogs

# Check filesystem disk usage
df -h
# Shows mounted filesystems and their usage
# -h: human-readable
# Important: watch for partitions >90% full

# Find the largest files
find /var/log -type f -exec du -h {} + | sort -rh | head -10
# Finds 10 largest files in /var/log
# Useful for cleanup operations

# View filesystem types
mount | column -t
# Shows all mounted filesystems
# column -t formats into neat columns
# Shows: device, mount point, filesystem type, options
```

---

#### Exercise 2.1: File System Exploration

**Objective:** Become familiar with the Linux directory structure and locate key system files.

1. List the contents of `/bin`, `/sbin`, and `/usr/bin` - compare the number of files in each
2. View your OS information from `/etc/os-release` and write down your distribution name and version
3. Check `/var/log` and identify at least 5 different log files - what do you think each one tracks?
4. View CPU information from `/proc/cpuinfo` - how many CPU cores do you have?
5. View memory information from `/proc/meminfo` - how much total RAM is shown?
6. Use the `tree` command (install if needed) to visualize the structure of `/etc` (limit depth to 2 levels)
7. Check which filesystems are currently mounted using `mount`
8. Find the 5 largest directories in `/var`

**Expected Results:**
- You should understand the purpose of major directories
- You'll know where to find configuration files, logs, and binaries
- You'll be comfortable navigating the file system structure

**Success Check:**
```bash
# Verify you can answer these questions:
# 1. Where are user home directories located?
echo "User homes: /home"

# 2. Where are system log files stored?
echo "System logs: /var/log"

# 3. Where would you find the SSH configuration?
ls /etc/ssh/

# 4. How much space is /var using?
du -sh /var
```

---

#### Challenge 2.1: Create a File System Map

**Objective:** Document your understanding of the Linux file system hierarchy.

Create a text file called `filesystem_map.txt` that contains:

1. A list of all top-level directories in `/`
2. For each directory, write a 1-2 sentence description of its purpose
3. List 3 important files or subdirectories in each of these directories:
   - `/etc`
   - `/var`
   - `/usr`
   - `/proc`
4. Include examples of:
   - Where you would find executable programs
   - Where log files are stored
   - Where user data is stored
   - Where temporary files go
5. Add a section on "Virtual Filesystems" explaining `/proc` and `/sys`

**Requirements:**
- Use proper formatting with sections and headers
- Include actual command examples to demonstrate each point
- Make it a reference document you can use later

**Bonus Challenge:**
- Use the `tree` command to create ASCII art directory trees for major sections
- Include file counts for each major directory
- Document any interesting or unusual files you discover

**Hint to get started:**
```bash
echo "# Linux Filesystem Hierarchy" > filesystem_map.txt
echo "## Created: $(date)" >> filesystem_map.txt
echo "" >> filesystem_map.txt
echo "## Root Directory (/)" >> filesystem_map.txt
echo "- Purpose: The top-level directory..." >> filesystem_map.txt
# Continue building your documentation
```

---

### Day 9: File Permissions - Part 1

File permissions are the cornerstone of Linux security. Every file and directory has permissions that control who can read, write, or execute them. Understanding permissions is essential for both security and functionality.

#### Understanding Permission Structure

When you run `ls -l`, you see permission information:

```bash
ls -l example.txt
# Example output:
# -rw-r--r-- 1 john developers 1234 Jan 15 10:30 example.txt

# Let's break down this output:
# -rw-r--r--  : permissions
# 1           : number of hard links
# john        : owner (user)
# developers  : group
# 1234        : file size in bytes
# Jan 15 10:30: modification date and time
# example.txt : filename
```

**Permission String Breakdown:**

```bash
# The permission string has 10 characters:
# Position:  0  1-3  4-6  7-9
# Example:   -  rw-  r--  r--
#            |   |    |    |
#            |   |    |    +-- Others permissions
#            |   |    +------- Group permissions  
#            |   +------------ Owner (user) permissions
#            +---------------- File type

# Position 0 - File Type:
# -  : Regular file
# d  : Directory
# l  : Symbolic link
# c  : Character device (e.g., terminal)
# b  : Block device (e.g., hard drive)
# s  : Socket
# p  : Named pipe (FIFO)

# Positions 1-3 - Owner Permissions:
# r  : Read permission (4)
# w  : Write permission (2)
# x  : Execute permission (1)
# -  : Permission not granted (0)

# Positions 4-6 - Group Permissions:
# Same as owner permissions but for group members

# Positions 7-9 - Others Permissions:
# Same as owner permissions but for everyone else
```

#### Permission Values and Meanings

```bash
# ===== NUMERIC (OCTAL) REPRESENTATION =====

# Each permission has a numeric value:
# r (read)    = 4
# w (write)   = 2
# x (execute) = 1
# - (none)    = 0

# Add values to get the permission number:
# rwx = 4+2+1 = 7  (all permissions)
# rw- = 4+2+0 = 6  (read and write)
# r-x = 4+0+1 = 5  (read and execute)
# r-- = 4+0+0 = 4  (read only)
# -wx = 0+2+1 = 3  (write and execute, rare)
# -w- = 0+2+0 = 2  (write only, very rare)
# --x = 0+0+1 = 1  (execute only)
# --- = 0+0+0 = 0  (no permissions)

# Three-digit permission number:
# First digit  = Owner permissions
# Second digit = Group permissions
# Third digit  = Others permissions

# Common permission patterns:
# 777 = rwxrwxrwx : Everyone can do everything (DANGEROUS!)
# 755 = rwxr-xr-x : Owner: all, Group: read+execute, Others: read+execute
# 644 = rw-r--r-- : Owner: read+write, Group: read, Others: read
# 600 = rw------- : Owner: read+write, Group: none, Others: none (private file)
# 700 = rwx------ : Owner: all, Group: none, Others: none (private script)
# 444 = r--r--r-- : Everyone read-only
```

#### What Permissions Mean for Files vs Directories

The same permission letters have different meanings depending on whether they're applied to a file or directory:

```bash
# ===== FOR FILES =====

# r (read) - Can view file contents
cat file.txt        # Works if you have read permission
less file.txt       # Works if you have read permission

# w (write) - Can modify file contents
echo "text" >> file.txt    # Works if you have write permission
nano file.txt              # Can save changes if you have write permission
# NOTE: Write permission does NOT allow deleting the file
# Deletion is controlled by directory permissions!

# x (execute) - Can run file as a program
./script.sh         # Works if you have execute permission
# For scripts, you also need read permission to see contents
# For compiled binaries, execute is enough

# ===== FOR DIRECTORIES =====

# r (read) - Can list directory contents
ls directory/       # Works if you have read permission on directory
# Can see filenames but may not access files without execute permission

# w (write) - Can create/delete files in directory
touch directory/newfile    # Works if you have write permission
rm directory/file          # Works if you have write permission
# Write permission alone is not useful without execute permission

# x (execute) - Can enter directory and access files
cd directory/       # Works if you have execute permission
cat directory/file  # Requires execute permission on directory
# Execute permission is required to access files inside
# Can access files even without read permission if you know filenames!

# Common directory permission patterns:
# drwx------ (700): Private directory, only owner can access
# drwxr-xr-x (755): Public directory, anyone can list and enter
# drwxrwx--- (770): Shared directory, owner and group can modify
# drwxr-x--- (750): Owner full access, group can read, others nothing
```

#### Changing Permissions with chmod (Numeric Mode)

```bash
# Basic syntax: chmod MODE FILE

# ===== COMMON PERMISSION PATTERNS =====

# Make file readable and writable by owner only (private document)
chmod 600 private.txt
# Result: -rw-------
# Owner can read and write
# Nobody else can do anything
# Use case: passwords, private keys, confidential documents

# Make file readable by everyone, writable by owner (public document)
chmod 644 document.txt
# Result: -rw-r--r--
# Owner can read and write
# Group and others can only read
# Use case: web pages, public documents, config files

# Make file executable by owner (private script)
chmod 700 myscript.sh
# Result: -rwx------
# Owner can read, write, and execute
# Nobody else can do anything
# Use case: personal scripts, private executables

# Make file executable by everyone (public program)
chmod 755 program.sh
# Result: -rwxr-xr-x
# Owner can read, write, and execute
# Group and others can read and execute
# Use case: system commands, shared scripts
# Most common permission for executable files

# Make directory accessible by owner and group (shared workspace)
chmod 770 shared_project/
# Result: drwxrwx---
# Owner and group can do everything
# Others cannot access at all
# Use case: team project directories

# Make directory publicly accessible (public directory)
chmod 755 public_html/
# Result: drwxr-xr-x
# Owner can create/delete/list files
# Everyone else can list and enter
# Use case: web directories, public file shares

# Remove all permissions (lock file)
chmod 000 locked.txt
# Result: ----------
# Nobody can access, not even owner!
# Even owner needs to chmod again to access
# Use case: Rarely used, for testing or very specific security needs

# World-writable (DANGEROUS - avoid!)
chmod 777 dangerous.txt
# Result: -rwxrwxrwx
# Everyone can do everything
# SECURITY RISK: Anyone can modify or delete
# Avoid unless absolutely necessary and you understand the risks

# ===== RECURSIVE CHANGES =====

# Change permissions recursively (all files and subdirectories)
chmod -R 755 directory/
# -R flag means recursive
# Applies permissions to directory and everything inside
# ⚠️ WARNING: Be careful with recursive chmod
# Can break things if you set wrong permissions

# Common mistake: Setting 755 on all files recursively
# chmod -R 755 .     # DON'T DO THIS!
# Problem: Makes all files executable, including text files
# Better: Set directories and files separately (more on this later)
```

#### Changing Permissions with chmod (Symbolic Mode)

Symbolic mode is more precise and safer than numeric mode because it modifies only specific permissions without affecting others.

```bash
# Basic syntax: chmod WHO+/-/=PERMISSION FILE
# WHO: u (user/owner), g (group), o (others), a (all)
# +/-/=: add, remove, or set exactly
# PERMISSION: r (read), w (write), x (execute)

# ===== ADDING PERMISSIONS =====

# Add execute permission for owner
chmod u+x script.sh
# Adds execute, keeps other permissions unchanged
# If file was rw-r--r--, it becomes rwxr--r--

# Add write permission for group
chmod g+w file.txt
# If file was rw-r--r--, it becomes rw-rw-r--
# Now group members can modify the file

# Add read permission for others
chmod o+r file.txt
# Makes file readable by everyone

# Add execute permission for everyone
chmod a+x program
# Equivalent to: chmod ugo+x program
# Makes program executable by all users

# Add multiple permissions at once
chmod u+rwx file.txt
# Gives owner read, write, and execute

# Add different permissions for different groups
chmod u+x,g+w,o+r file.txt
# User gets execute, group gets write, others get read
# Comma-separated list of changes

# ===== REMOVING PERMISSIONS =====

# Remove write permission from group
chmod g-w file.txt
# If file was rw-rw-r--, it becomes rw-r--r--
# Group can no longer modify file

# Remove execute permission from owner
chmod u-x script.sh
# Makes script non-executable

# Remove all permissions for others
chmod o-rwx file.txt
# Others lose all access
# Equivalent to: chmod o-all file.txt

# Remove execute from everyone
chmod a-x file
# Nobody can execute anymore

# ===== SETTING EXACT PERMISSIONS =====

# Set owner permissions to read-write (removes execute if present)
chmod u=rw file.txt
# Sets owner to rw-, regardless of previous permissions
# If file was rwxr--r--, becomes rw-r--r--

# Set group permissions to read-only
chmod g=r file.txt
# Group can only read, write and execute are removed

# Set others to no permissions
chmod o= file.txt
# Equivalent to: chmod o-rwx file.txt
# Others have --- (no access)

# Set different permissions for each category
chmod u=rwx,g=rx,o=r file.txt
# Owner: rwx, Group: r-x, Others: r--
# Result: -rwxr-xr--

# ===== RECURSIVE AND SELECTIVE =====

# Recursively add execute for owner on all files
chmod -R u+x directory/
# -R applies to all contents
# Every file and subdirectory gets owner execute

# Add execute only to directories (not files)
find directory/ -type d -exec chmod u+x {} \;
# Uses find to target only directories
# Useful when you want directories executable but not files

# Add read permission for all, write for owner
chmod a+r,u+w file.txt
# Everyone can read, but only owner can write

# ===== COPYING PERMISSIONS =====

# Copy owner permissions to group
chmod g=u file.txt
# If owner has rwx, group will also have rwx
# Useful for sharing access with group

# Copy owner permissions to everyone
chmod a=u file.txt
# Everyone gets same permissions as owner
```

**Best Practices for Symbolic Mode:**
- Use symbolic mode when you want to modify specific permissions
- Use numeric mode when you want to set all permissions at once
- Symbolic mode is safer for scripts (doesn't accidentally change unrelated permissions)

#### Changing Ownership

```bash
# ===== CHANGING OWNER =====

# Change file owner
sudo chown newowner file.txt
# Changes owner from current user to 'newowner'
# Requires sudo (only root can change ownership)
# New owner must be a valid user on the system

# Verify ownership change
ls -l file.txt
# Check that owner name has changed

# ===== CHANGING GROUP =====

# Change file group only
sudo chgrp newgroup file.txt
# Changes group without affecting owner
# Useful when you want file owned by one user but accessible to a group

# Alternative: Change group with chown
sudo chown :newgroup file.txt
# Colon before group name means "change group only"
# Exactly the same as chgrp

# ===== CHANGING BOTH OWNER AND GROUP =====

# Change owner and group simultaneously
sudo chown newowner:newgroup file.txt
# Format: owner:group
# Changes both in one command
# Most efficient method

# Real-world example: Web server files
sudo chown www-data:www-data /var/www/html/index.html
# Web server runs as www-data user
# Gives web server ownership of web files

# ===== RECURSIVE OWNERSHIP CHANGES =====

# Change ownership recursively
sudo chown -R user:group directory/
# -R flag means recursive
# Changes owner and group of directory and all contents
# ⚠️ Be very careful with recursive chown!

# Real-world example: Fix home directory ownership
sudo chown -R john:john /home/john/
# Sometimes necessary after copying files with sudo
# Ensures user owns their entire home directory

# ===== PRACTICAL EXAMPLES =====

# Take ownership of a file (as root)
sudo chown $USER file.txt
# $USER is your username
# Useful when you need to edit a root-owned file

# Change ownership of newly created script
sudo chown john:developers myscript.sh
# Owner: john, Group: developers
# Allows john full control, developers group can read/execute

# Give ownership to web server
sudo chown www-data:www-data /var/www/mysite/
# Web server needs to own files it serves
# Common task when setting up websites

# ===== CHECKING BEFORE CHANGING =====

# Always check current ownership before changing
ls -l file.txt
# See current owner and group

# Find all files owned by specific user
find /path -user username
# Lists all files owned by username
# Useful before changing ownership

# Find all files belonging to specific group
find /path -group groupname
# Lists all files in specific group
```

**Important Notes:**
- Only root (or sudo) can change file ownership
- Regular users can only change group if they belong to both old and new groups
- Changing ownership of system files can break things - be careful!
- Always verify changes with `ls -l` after making them

---

#### Exercise 2.2: Basic Permission Practice

**Objective:** Master reading and setting file permissions.

1. Create a file called `test_perms.txt`
2. Check its default permissions with `ls -l`
3. Make the file readable and writable only by you (600)
4. Verify the permission change
5. Create a script file called `hello.sh` with content: `echo "Hello World"`
6. Make the script executable by owner only (700)
7. Run the script: `./hello.sh`
8. Create a directory called `test_dir`
9. Set permissions to 755 on the directory
10. Create a file inside the directory and check if you can access it from another terminal

**Expected Results:**
- `test_perms.txt` should show `-rw-------` permissions
- `hello.sh` should show `-rwx------` permissions and execute successfully
- `test_dir` should show `drwxr-xr-x` permissions
- You should understand what each permission digit means

**Success Check:**
```bash
# Verify test_perms.txt permissions
ls -l test_perms.txt | grep "^-rw-------"

# Verify hello.sh is executable and runs
./hello.sh && echo "Script works!"

# Verify directory permissions
ls -ld test_dir | grep "^drwxr-xr-x"
```

---

#### Challenge 2.2: Multi-File Permission Setup

**Objective:** Create files with specific permission requirements.

Create three files with these exact specifications:

1. **public.txt**
   - Everyone can read
   - Only owner can write
   - Nobody can execute
   - Use both numeric (644) and symbolic modes

2. **team.txt**
   - Owner can read and write
   - Group can read and write
   - Others cannot access
   - Use symbolic mode: `u=rw,g=rw,o=`

3. **private.txt**
   - Only owner can read and write
   - Nobody else can access
   - Use numeric mode: 600

**Requirements:**
1. Create all three files
2. Set permissions as specified
3. Verify with `ls -l`
4. Document what each file's permissions mean in plain English
5. Test the permissions:
   - Try to read each file
   - Try to modify each file (if permitted)
   - What happens if you try to execute them?

**Bonus Challenge:**
- Create a directory called `shared_workspace` with permissions 770
- Put all three files inside it
- What happens to file accessibility now?
- Try accessing as your user, then think about what a group member would experience

**Expected Output:**
```bash
ls -l
# Should show:
# -rw-r--r--  1 user group  0 date public.txt
# -rw-rw----  1 user group  0 date team.txt
# -rw-------  1 user group  0 date private.txt
```

---

### Day 10: File Permissions - Part 2

Beyond the basic read, write, and execute permissions, Linux has special permissions that provide additional security and functionality. These special permissions are essential for certain system operations and shared environments.

#### Special Permissions Overview

There are three special permission types:
1. **SUID (Set User ID)** - Run as file owner
2. **SGID (Set Group ID)** - Run as group or inherit group
3. **Sticky Bit** - Restrict deletion in shared directories

#### SUID - Set User ID

When SUID is set on an executable file, it runs with the permissions of the file's owner, not the user who executes it.

```bash
# ===== UNDERSTANDING SUID =====

# View a file with SUID set
ls -l /usr/bin/passwd
# Output: -rwsr-xr-x 1 root root ...
# Notice the 's' in owner's execute position
# This is SUID permission

# Why passwd needs SUID:
# - Changing password requires modifying /etc/shadow
# - Only root can write to /etc/shadow
# - But normal users need to change their own passwords
# - SUID allows passwd to run as root temporarily
# - User runs passwd, but it executes with root privileges

# ===== SETTING SUID =====

# Set SUID using symbolic mode
chmod u+s program
# Adds SUID to an executable
# When executed, runs with owner's privileges
# Shown as 's' or 'S' in owner execute position

# Set SUID using numeric mode
chmod 4755 program
# The leading 4 sets SUID
# Breaks down: 4 (SUID) + 755 (rwxr-xr-x)
# Result: -rwsr-xr-x

# Example: Create a custom program with SUID
echo '#!/bin/bash' > test_suid.sh
echo 'whoami' >> test_suid.sh
echo 'id' >> test_suid.sh
chmod 4755 test_suid.sh
# When you run this, it shows root if owner is root
# ⚠️ SECURITY WARNING: Never do this with real scripts!

# ===== SUID INDICATORS =====

# Lowercase 's' - SUID is set AND execute permission exists
-rwsr-xr-x    # Correct: owner has execute, SUID will work

# Uppercase 'S' - SUID is set BUT no execute permission
-rwSr-xr-x    # Wrong: SUID set but not executable, won't work

# ===== FINDING SUID FILES =====

# Find all SUID files on system (security audit)
find / -perm -4000 -type f 2>/dev/null
# -perm -4000: files with SUID bit set
# Useful for security audits
# SUID files can be security risks if misconfigured

# Find SUID files owned by root (most concerning for security)
find / -perm -4000 -user root -type f 2>/dev/null
# These files run with root privileges when executed
# Review this list regularly for security

# ===== REMOVING SUID =====

# Remove SUID permission
chmod u-s program
# Removes SUID, keeps other permissions

# Remove using numeric mode
chmod 0755 program
# The leading 0 removes all special permissions
```

**Security Warning:** SUID programs are powerful and potentially dangerous. Never set SUID on shell scripts in production systems. Only use SUID when absolutely necessary and understand the security implications.

#### SGID - Set Group ID

SGID has different effects depending on whether it's applied to a file or directory.

```bash
# ===== SGID ON EXECUTABLE FILES =====

# When SGID is set on an executable:
# - File executes with the group ownership
# - Similar to SUID but for group
# - Less common than SUID

# Set SGID on executable
chmod g+s program
# Adds SGID permission
# Shown as 's' in group execute position

# Set SGID using numeric mode
chmod 2755 program
# The leading 2 sets SGID
# Result: -rwxr-sr-x

# ===== SGID ON DIRECTORIES (More Common and Useful) =====

# When SGID is set on a directory:
# - New files created inherit the directory's group
# - Not the user's default group
# - Essential for shared project directories

# Create a shared project directory
mkdir /tmp/project
chmod 2775 /tmp/project
sudo chown $(whoami):developers /tmp/project
# Now any file created inside inherits 'developers' group
# All team members can collaborate

# Example workflow:
cd /tmp/project
touch file1.txt
ls -l file1.txt
# Owner: your username
# Group: developers (not your default group!)
# This is SGID in action

# SGID indicators:
drwxrwsr-x    # Lowercase 's': SGID set with execute (works)
drwxrwSr-x    # Uppercase 'S': SGID set without execute (broken)

# ===== PRACTICAL SGID EXAMPLE =====

# Setup a team workspace
sudo mkdir /opt/teamproject
sudo chown :developers /opt/teamproject
sudo chmod 2775 /opt/teamproject
# Now when any team member creates files:
# - Files automatically belong to 'developers' group
# - Other team members can access them
# - No need to manually change group ownership

# Verify SGID
ls -ld /opt/teamproject
# Should show: drwxrwsr-x ... developers ...

# ===== FINDING SGID FILES =====

# Find all SGID files and directories
find / -perm -2000 2>/dev/null
# -perm -2000: items with SGID bit set
# Useful for auditing

# Find SGID directories specifically
find / -type d -perm -2000 2>/dev/null
# Shows only directories with SGID

# ===== REMOVING SGID =====

# Remove SGID permission
chmod g-s directory/
# Removes SGID, keeps other permissions

# Remove using numeric mode
chmod 0775 directory/
# Leading 0 removes all special permissions
```

**Use Case:** SGID on directories is extremely useful for team projects, shared workspaces, and any situation where multiple users need to collaborate on files.

#### Sticky Bit

The sticky bit is a special permission used on directories to restrict file deletion. Even if a user has write permission on the directory, they can only delete files they own.

```bash
# ===== UNDERSTANDING STICKY BIT =====

# View /tmp with sticky bit
ls -ld /tmp
# Output: drwxrwxrwt 1 root root ...
# Notice the 't' at the end
# This is the sticky bit

# Why /tmp needs sticky bit:
# - /tmp is world-writable (anyone can create files)
# - Without sticky bit, anyone could delete anyone else's files
# - With sticky bit, you can only delete your own files
# - Prevents users from deleting each other's temp files

# ===== SETTING STICKY BIT =====

# Set sticky bit using symbolic mode
chmod +t directory/
# Adds sticky bit to a directory
# Shown as 't' or 'T' in others' execute position

# Set sticky bit using numeric mode
chmod 1777 directory/
# The leading 1 sets sticky bit
# 777 makes directory world-writable
# Result: drwxrwxrwt

# ===== STICKY BIT INDICATORS =====

# Lowercase 't' - sticky bit set AND execute permission exists
drwxrwxrwt    # Correct: others have execute, sticky bit works

# Uppercase 'T' - sticky bit set BUT no execute permission
drwxrwxrwT    # Wrong: others can't enter directory, sticky bit useless

# ===== PRACTICAL STICKY BIT EXAMPLE =====

# Create a shared upload directory
mkdir /tmp/shared_upload
chmod 1777 /tmp/shared_upload
# Anyone can create files
# But users can only delete their own files

# Test the sticky bit:
cd /tmp/shared_upload
echo "My file" > myfile.txt
ls -l myfile.txt
# Owner: you
# Now try to delete another user's file (you can't!)
# But you CAN delete your own files

# ===== COMMON USE CASES =====

# Public drop directory (like a mailbox)
mkdir /var/spool/uploads
chmod 1733 /var/spool/uploads
# 1733 = sticky bit + owner: rwx, group: wx, others: wx
# Users can drop files but not list or read others' files
# Only owner can see all files

# Shared workspace with sticky bit
mkdir /tmp/collaborative
chmod 1777 /tmp/collaborative
# Everyone can create and modify files
# But can't delete others' work

# ===== FINDING STICKY BIT DIRECTORIES =====

# Find all directories with sticky bit
find / -type d -perm -1000 2>/dev/null
# -perm -1000: directories with sticky bit set
# /tmp should be in this list

# ===== REMOVING STICKY BIT =====

# Remove sticky bit permission
chmod -t directory/
# Removes sticky bit, keeps other permissions

# Remove using numeric mode
chmod 0777 directory/
# Leading 0 removes all special permissions
```

**Common Mistake:** Setting sticky bit on regular files - it only works on directories and has no effect on files in modern Linux.

#### Combining Special Permissions

```bash
# You can combine multiple special permissions:

# SUID + standard permissions
chmod 4755 file
# -rwsr-xr-x (SUID + 755)

# SGID + standard permissions
chmod 2755 directory
# drwxr-sr-x (SGID + 755)

# Sticky bit + standard permissions
chmod 1777 directory
# drwxrwxrwt (sticky + 777)

# All three special permissions (rare!)
chmod 7755 file
# 7 = 4 (SUID) + 2 (SGID) + 1 (sticky)
# -rwsr-sr-t
# Rarely useful to combine all three

# SGID + sticky bit (common for shared directories)
chmod 3770 /shared
# 3 = 2 (SGID) + 1 (sticky)
# drwxrws--T
# Perfect for team collaboration directories
```

#### Understanding umask

`umask` controls the default permissions for newly created files and directories.

```bash
# ===== VIEWING UMASK =====

# Display current umask
umask
# Common values: 0022, 0002, 0077
# Shows the permissions that will be REMOVED from defaults

# Display umask in symbolic form
umask -S
# Shows permissions that WILL be set
# Example: u=rwx,g=rx,o=rx
# More intuitive than numeric form

# ===== HOW UMASK WORKS =====

# Default permissions WITHOUT umask:
# Files:       666 (rw-rw-rw-)
# Directories: 777 (rwxrwxrwx)

# umask SUBTRACTS from these defaults

# Example with umask 0022:
# Files:       666 - 022 = 644 (rw-r--r--)
# Directories: 777 - 022 = 755 (rwxr-xr-x)
# This is the default on most systems

# Example with umask 0002:
# Files:       666 - 002 = 664 (rw-rw-r--)
# Directories: 777 - 002 = 775 (rwxrwxr-x)
# More group-friendly

# Example with umask 0077:
# Files:       666 - 077 = 600 (rw-------)
# Directories: 777 - 077 = 700 (rwx------)
# Maximum privacy (only owner can access)

# ===== SETTING UMASK =====

# Set umask for current session
umask 022
# New files will be 644, directories will be 755

# More restrictive umask (private)
umask 077
# New files will be 600, directories will be 700
# Good for sensitive data

# Group-friendly umask
umask 002
# New files will be 664, directories will be 775
# Good for collaborative environments

# Test your umask:
touch testfile
mkdir testdir
ls -l
# Check the permissions of newly created items

# ===== MAKING UMASK PERMANENT =====

# Add to ~/.bashrc for persistence
echo "umask 022" >> ~/.bashrc
source ~/.bashrc
# Now your umask persists across sessions

# System-wide umask (requires root)
sudo nano /etc/profile
# Add: umask 022
# Affects all users
```

**Best Practices:**
- Default umask (0022) is good for most users
- Use 0077 for servers handling sensitive data
- Use 0002 for development teams sharing code

#### File Attributes (Extended Attributes)

Linux has extended file attributes that provide additional protection beyond permissions.

```bash
# ===== VIEWING FILE ATTRIBUTES =====

# List file attributes
lsattr filename
# Shows attributes set on file
# Common output: ----i-------e----- filename
# Each letter represents an attribute

# List attributes for all files in directory
lsattr *
# Shows attributes for every file

# ===== IMPORTANT ATTRIBUTES =====

# i - Immutable
# File cannot be modified, deleted, renamed, or linked
# Even root cannot modify an immutable file!
# Must remove immutable attribute first

# Set immutable attribute (requires sudo)
sudo chattr +i important.txt
# Now the file is protected:
# - Cannot be edited
# - Cannot be deleted
# - Cannot be renamed
# - Cannot be linked

# Try to delete (will fail!)
rm important.txt
# Error: Operation not permitted

# Try to modify (will fail!)
echo "text" >> important.txt
# Error: Operation not permitted

# Remove immutable attribute
sudo chattr -i important.txt
# Now file can be modified again

# ===== APPEND-ONLY ATTRIBUTE =====

# a - Append-only
# File can only be opened in append mode
# Perfect for log files
# Prevents accidental data deletion
# Can add new lines but cannot modify or delete existing ones

# Set append-only
sudo chattr +a logfile.log
# Now you can append:
echo "New log entry" >> logfile.log    # Works!
# But cannot overwrite:
echo "Replace" > logfile.log            # Fails!
# Cannot delete:
rm logfile.log                          # Fails!

# Remove append-only attribute
sudo chattr -a logfile.log

# ===== OTHER USEFUL ATTRIBUTES =====

# c - Compressed
# File is automatically compressed by the filesystem
# Transparent to applications

# s - Secure deletion
# When deleted, file data is overwritten with zeros
# Makes recovery impossible

# u - Undeletable
# When deleted, file contents are saved
# Can be recovered

# ===== PRACTICAL EXAMPLES =====

# Protect configuration file from accidental changes
sudo chattr +i /etc/important.conf
# Sysadmin can't accidentally delete or modify
# Must consciously remove attribute to edit

# Protect system log from tampering
sudo chattr +a /var/log/critical.log
# Can only append new entries
# Old entries cannot be modified or deleted
# Prevents log tampering by intruders

# ===== CHECKING AND REMOVING ATTRIBUTES =====

# View all attributes
lsattr filename
# Output example: ----i--------e----- filename
#                     ^
#                     immutable flag

# Remove specific attribute
sudo chattr -i filename
# Removes immutable attribute

# Remove all attributes
sudo chattr -ai filename
# Removes immutable and append-only
```

**Use Cases for Attributes:**
- **Immutable**: System configuration files, license files, read-only documentation
- **Append-only**: Log files, audit trails, accounting records
- **Security**: Prevent malware from modifying critical files
- **Compliance**: Meet regulatory requirements for data protection

**Important Notes:**
- Attributes require sudo/root to set
- Attributes persist across permission changes
- Backup programs may not preserve attributes
- Not all filesystems support all attributes (ext4 supports most)

---

#### Exercise 2.3: Special Permissions and Attributes

**Objective:** Understand and apply special permissions and file attributes.

1. Check the current umask on your system
2. Calculate what permissions new files will have with your current umask
3. Find three files with SUID permission in `/usr/bin` (Hint: use `find`)
4. Create a directory called `shared_dir` and set SGID permission on it
5. Create a file inside `shared_dir` and verify it inherited the directory's group
6. Create a directory called `sticky_test` and set sticky bit permission
7. Create a file called `protected.txt` and make it immutable
8. Try to delete `protected.txt` - what happens?
9. Remove the immutable attribute and delete the file
10. Create a file called `append_only.log` and set the append-only attribute
11. Try to overwrite it - what happens?
12. Try to append to it - does this work?

**Expected Results:**
- You should understand how umask affects new files
- SGID directory should show 's' in group permissions
- Files in SGID directory should inherit the directory's group
- Immutable file should be protected from all modifications
- Append-only file should allow appending but prevent overwriting

**Success Check:**
```bash
# Verify SGID on directory
ls -ld shared_dir | grep "s"

# Verify sticky bit
ls -ld sticky_test | grep "t"

# Verify immutable attribute
lsattr protected.txt | grep "i"
```

---

#### Challenge 2.3: Create a Secure Shared Workspace

**Objective:** Set up a directory structure for team collaboration with proper permissions.

Create a shared workspace with these requirements:

1. **Base Directory:** `/tmp/team_workspace`
   - Owner: your user
   - Group: your primary group
   - Permissions: 2770 (SGID + rwx for owner and group)
   - Purpose: Automatic group inheritance

2. **Subdirectory:** `team_workspace/uploads`
   - Permissions: 3777 (SGID + sticky bit + rwx for all)
   - Purpose: Anyone can upload, but can only delete their own files

3. **Subdirectory:** `team_workspace/protected`
   - Permissions: 2750 (SGID + rwx for owner, rx for group)
   - Purpose: Shared viewing, only owner can modify

4. **File:** `team_workspace/config.conf`
   - Permissions: 644
   - Attribute: Immutable
   - Purpose: Configuration file that nobody can accidentally modify

5. **File:** `team_workspace/activity.log`
   - Permissions: 664
   - Attribute: Append-only
   - Purpose: Log file that can only grow

**Tasks:**
1. Create the directory structure
2. Set all permissions correctly
3. Set appropriate attributes
4. Verify everything with `ls -l`, `ls -ld`, and `lsattr`
5. Document what each permission does and why it's appropriate
6. Test the setup:
   - Create a file in uploads directory
   - Try to delete another user's file from uploads (simulate if needed)
   - Try to modify config.conf
   - Append to activity.log
   - Try to overwrite activity.log

**Bonus Challenge:**
- Create a script that sets up this entire structure automatically
- Include error checking to ensure commands succeeded
- Make the script reusable with variables for paths and groups

---

### Day 11: Links and File Types

Linux has two types of links: hard links and symbolic links. Understanding the difference is important for system administration and efficient file management.

#### Understanding Inodes

Before we discuss links, we need to understand inodes:

```bash
# An inode (index node) is a data structure that stores information about a file:
# - File size
# - Owner and group
# - Permissions
# - Timestamps
# - Location of data blocks on disk
# - Link count (number of hard links)

# View inode numbers
ls -li
# The first column is the inode number
# Example output:
# 1234567 -rw-r--r-- 1 user group 100 file.txt
#       ^
#       inode number

# Files with the same inode number are the same file
# They share the same data on disk

# View detailed inode information
stat filename
# Shows:
# - Inode number
# - Links count
# - Size
# - Permissions
# - Timestamps (access, modify, change)
```

#### Hard Links

A hard link is an additional name for an existing file. Hard links share the same inode number - they ARE the same file, just with multiple names.

```bash
# ===== CREATING HARD LINKS =====

# Create a hard link
ln source.txt hardlink.txt
# Creates a new directory entry pointing to the same inode
# Both names reference the exact same file data
# Syntax: ln SOURCE LINK_NAME

# Verify they're the same file (same inode)
ls -li source.txt hardlink.txt
# Output example:
# 1234567 -rw-r--r-- 2 user group 100 Jan 15 10:30 source.txt
# 1234567 -rw-r--r-- 2 user group 100 Jan 15 10:30 hardlink.txt
#       ^                        ^
#   Same inode              Link count = 2

# ===== UNDERSTANDING HARD LINK BEHAVIOR =====

# Modify the original file
echo "New content" >> source.txt
cat hardlink.txt
# Output: Shows "New content"
# Both names see the same content because they're the same file!

# Check the link count
ls -l source.txt
# Second column shows 2 (two names point to this inode)

# Delete the original file
rm source.txt
ls -li hardlink.txt
# hardlink.txt still exists and still has the data!
# Data isn't deleted until ALL hard links are removed
# Link count is now 1

# Delete the last link
rm hardlink.txt
# NOW the data is actually deleted
# When link count reaches 0, the inode is freed

# ===== HARD LINK LIMITATIONS =====

# Cannot create hard links to directories (prevented by filesystem)
ln /home/user/dir hardlinkdir    # FAILS
# Reason: Would create circular references and break filesystem structure

# Cannot create hard links across filesystems/partitions
ln /home/user/file.txt /mnt/external/file.txt    # FAILS
# Reason: Different filesystems have separate inode tables
# Inodes are only unique within a single filesystem

# ===== PRACTICAL USES OF HARD LINKS =====

# Backup without using extra space
ln important.txt important_backup.txt
# Both names point to same data
# No extra disk space used
# If you accidentally delete one, other still exists

# Multiple access points to same file
ln /usr/local/bin/program /usr/bin/program
# Same program accessible from multiple locations
# Updates to one affect both (because they're the same file)

# Find all hard links to a file
find / -inum $(ls -i file.txt | awk '{print $1}') 2>/dev/null
# Searches by inode number
# Shows all paths that reference the same file
```

**Key Points About Hard Links:**
- Same inode = same file
- Link count shows how many names the file has
- Data is not deleted until all hard links are removed
- Cannot span filesystems
- Cannot link directories
- Changes to one name affect all names

#### Symbolic (Soft) Links

A symbolic link (symlink) is a special file that contains a path to another file. It's like a shortcut in Windows.

```bash
# ===== CREATING SYMBOLIC LINKS =====

# Create a symbolic link
ln -s /path/to/source linkname
# -s means "symbolic"
# Creates a special file that points to target
# Syntax: ln -s TARGET LINK_NAME

# Example:
ln -s /usr/share/doc/python3 python_docs
# Creates 'python_docs' pointing to Python documentation

# Verify it's a symbolic link
ls -l python_docs
# Output: lrwxrwxrwx 1 user group 24 Jan 15 10:30 python_docs -> /usr/share/doc/python3
#         ^                                                                        ^
#     l means link                                          Arrow shows target

# ===== SYMBOLIC LINK BEHAVIOR =====

# Create a test file and symlink
echo "Original content" > original.txt
ln -s original.txt link.txt

# Read through the link
cat link.txt
# Shows: Original content
# Link transparently accesses the target file

# Modify through the link
echo "Added line" >> link.txt
cat original.txt
# Shows both lines
# Modifications through link affect the target

# Check inode numbers (DIFFERENT from hard links!)
ls -li original.txt link.txt
# Different inode numbers - they're separate files
# link.txt is a special file that contains the path to original.txt

# ===== BROKEN LINKS =====

# Delete the original file
rm original.txt
ls -l link.txt
# Link still exists but target is gone
# Output shows: link.txt -> original.txt
# But trying to access it fails:
cat link.txt
# Error: No such file or directory

# This is a "broken" or "dangling" link
# The link exists but points to nothing

# Find broken symlinks in directory
find . -type l -exec test ! -e {} \; -print
# Finds symlinks whose targets don't exist
# -type l: find symlinks
# test ! -e: check if target doesn't exist

# Alternative using find -L:
find -L . -type l
# -L follows symlinks
# Reports links that can't be followed (broken)

# ===== ABSOLUTE VS RELATIVE SYMLINKS =====

# Absolute symlink (full path)
ln -s /home/user/documents/file.txt link1
# Works from anywhere
# But breaks if you move the directory structure

# Relative symlink (relative path)
ln -s ../documents/file.txt link2
# Path is relative to link location
# More flexible when moving directory trees
# Recommended for most cases

# Example of relative link advantage:
mkdir project
mkdir project/bin
mkdir project/config
echo "config data" > project/config/app.conf
ln -s ../config/app.conf project/bin/config
# If you move 'project' directory elsewhere, link still works!

# ===== WORKING WITH SYMLINKS =====

# Show where a symlink points
readlink linkname
# Output: /path/to/target
# Shows the target path

# Show absolute path (resolve all symlinks)
readlink -f linkname
# Follows the entire chain and shows final absolute path
# Useful when links point to other links

# Remove a symlink (NOT the target!)
rm linkname
# OR
unlink linkname
# Removes only the link, not the target file
# ⚠️ Do NOT use rm -r on symlink to directory!

# Remove symlink to directory (CORRECT way)
rm linkname
# OR
unlink linkname
# ❌ WRONG: rm -r linkname (this would delete the target directory contents!)

# Create symlink with same name as target
ln -s /etc/nginx/sites-available/mysite .
# Creates ./mysite pointing to the full path

# Force symlink creation (overwrite existing)
ln -sf /new/target existing_link
# -f flag: force, removes existing link first
# Useful for updating links

# ===== PRACTICAL USES OF SYMBOLIC LINKS =====

# Link commonly used directories to convenient locations
ln -s /var/log ~/logs
# Now you can access logs with: cd ~/logs

# Multiple versions of software
ln -s /opt/python/python3.9/bin/python3 /usr/local/bin/python
# Point 'python' to specific version
# Easy to change versions by updating link

# Website configuration (common in web servers)
ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/mysite
# Enable site by creating link
# Disable by removing link
# Original config stays in sites-available

# Backwards compatibility
ln -s /usr/bin/new-command /usr/bin/old-command
# Old scripts using old-command still work
# But actually run new-command

# ===== FINDING SYMLINKS =====

# Find all symbolic links in directory
find /path -type l
# -type l: symbolic links only

# Find symlinks pointing to specific target
find /path -lname "*target*"
# -lname: match against link target
# Wildcard matching on target name

# Find symlinks and show what they point to
find /path -type l -ls
# Shows detailed info including target

# Count symlinks in directory tree
find /path -type l | wc -l
```

**Key Differences: Hard Links vs Symbolic Links:**

| Feature | Hard Link | Symbolic Link |
|---------|-----------|---------------|
| **Inode** | Same as original | Different (own inode) |
| **Survives original deletion** | Yes | No (becomes broken) |
| **Cross filesystems** | No | Yes |
| **Link to directories** | No | Yes |
| **Can be relative** | N/A | Yes |
| **Shows target in ls -l** | No | Yes |
| **Disk space** | None (same file) | Tiny (just the path) |

#### File Types and the `file` Command

Linux has several file types, and the `file` command can identify them:

```bash
# ===== USING THE FILE COMMAND =====

# Identify file type
file filename
# Analyzes file content (not just extension)
# Examples:
# - file script.sh → Bourne-Again shell script, ASCII text executable
# - file image.jpg → JPEG image data
# - file program → ELF 64-bit LSB executable

# Brief output (without filename)
file -b filename
# Output just the file type
# Useful in scripts

# Check multiple files at once
file *
# Analyzes all files in current directory

# Check MIME type
file --mime-type filename
# Output: filename: text/plain
# Useful for web servers

# ===== FILE TYPES IN LINUX =====

# Regular file: -
-rw-r--r--  # First character is dash

# Directory: d
drwxr-xr-x  # First character is 'd'

# Symbolic link: l
lrwxrwxrwx  # First character is 'l'

# Block device: b (hard drives, USB drives)
brw-rw----  # First character is 'b'
# Example: /dev/sda

# Character device: c (terminals, serial ports)
crw-rw-rw-  # First character is 'c'
# Example: /dev/tty

# Socket: s (inter-process communication)
srwxrwxrwx  # First character is 's'
# Example: /var/run/docker.sock

# Named pipe (FIFO): p
prw-r--r--  # First character is 'p'
# Used for process communication

# ===== PRACTICAL FILE COMMAND EXAMPLES =====

# Identify unknown files
file mysterious_file
# Tells you what it is without opening it

# Verify downloaded file
file ubuntu-20.04.iso
# Should show: ISO 9660 CD-ROM filesystem data

# Check if file is text or binary
file /usr/bin/ls
# Binary: ELF 64-bit LSB executable
file /etc/passwd
# Text: ASCII text

# Find all script files in directory
find . -type f -exec file {} \; | grep "shell script"
# Finds shell scripts regardless of extension

# Recursively check file types
find /path -type f -exec file {} \; | sort | uniq -c
# Shows count of each file type

# Check for executable files
file /usr/bin/* | grep "executable"
# Lists all executable programs
```

---

#### Exercise 2.4: Links and File Types Practice

**Objective:** Master hard links, symbolic links, and file type identification.

1. Create a file called `original.txt` with some content
2. Create a hard link called `hardlink.txt` pointing to `original.txt`
3. Verify both have the same inode number
4. Modify `hardlink.txt` and check `original.txt` - what do you see?
5. Delete `original.txt` - does `hardlink.txt` still work?
6. Create a new file called `target.txt`
7. Create a symbolic link called `symlink.txt` pointing to `target.txt`
8. Verify the symlink with `ls -l`
9. Delete `target.txt` - what happens to `symlink.txt`?
10. Create a directory called `docs` and create a symbolic link to it
11. Use the `file` command on at least 10 different files on your system
12. Find all symbolic links in `/usr/bin`

**Expected Results:**
- Hard links should show same inode number and survive original deletion
- Symbolic links should show arrow (->) and become broken when target is deleted
- `file` command should correctly identify different file types
- You should understand when to use each type of link

**Success Check:**
```bash
# Verify hard links have same inode
test $(stat -c %i original.txt) -eq $(stat -c %i hardlink.txt) && echo "Same inode!"

# Verify symlink points to target
readlink symlink.txt

# Count symlinks in /usr/bin
find /usr/bin -type l | wc -l
```

---

#### Challenge 2.4: Link Recovery and Management

**Objective:** Understand and fix link issues.

**Scenario:** You have a symbolic link that has become broken, and you need to fix it.

**Tasks:**

1. Create this directory structure:
   ```
   project/
   ├── data/
   │   └── config.txt
   ├── app/
   │   └── config -> ../data/config.txt (symlink)
   └── backup/
   ```

2. Verify the symlink works by reading through it

3. Move `data/config.txt` to `backup/config.txt`

4. Observe that `app/config` is now broken

5. Fix the broken link without recreating it (update the link target)

6. Create a script called `find_broken_links.sh` that:
   - Takes a directory path as argument
   - Finds all broken symbolic links
   - Lists them with their targets
   - Optionally removes them (with confirmation)

**Requirements:**
- Document each step
- Explain why the link broke
- Show multiple ways to fix broken links
- Make your script reusable

**Bonus Challenge:**
- Create hardlinks to all `.txt` files in a directory
- Move one of the original files - prove the hard link still works
- Calculate how much space was "saved" using hard links instead of copies

**Expected Script Output:**
```bash
./find_broken_links.sh /path/to/directory
# Found 3 broken symlinks:
# /path/link1 -> /missing/target1
# /path/link2 -> /missing/target2
# /path/link3 -> /missing/target3
# Remove broken links? (y/n):
```

---

### Day 12: Finding Files and Advanced Searching

Being able to locate files quickly is essential for system administration. Linux provides powerful tools for finding files by name, size, date, content, and more.

#### The `find` Command - Comprehensive File Searching

The `find` command is one of the most powerful and versatile tools in Linux. It can search by virtually any file attribute.

```bash
# ===== BASIC FIND SYNTAX =====

# Basic syntax: find [path] [options] [expression]

# Find by filename (exact match)
find /path -name "filename"
# Searches /path and all subdirectories
# Case-sensitive exact match

# Find in current directory
find . -name "*.txt"
# The dot (.) means current directory
# Finds all .txt files

# Find from root (entire system)
find / -name "config.conf" 2>/dev/null
# Searches entire filesystem
# 2>/dev/null hides permission errors
# Useful but can be slow on large systems

# ===== SEARCH BY NAME =====

# Case-insensitive search
find . -iname "readme.txt"
# Matches: README.TXT, ReadMe.txt, readme.TXT, etc.
# Very useful when case is uncertain

# Wildcard patterns
find /var -name "*.log"
# Finds all files ending in .log
# Note: Quotes prevent shell expansion

find /etc -name "*.conf"
# Finds all configuration files

# Find files starting with specific text
find . -name "test*"
# Matches: test.txt, test123, testing, etc.

# Multiple patterns (OR condition)
find . -name "*.txt" -o -name "*.md"
# -o means OR
# Finds files ending in .txt OR .md

# ===== SEARCH BY TYPE =====

# Find regular files only
find . -type f
# Excludes directories, links, etc.
# Most common when searching for files

# Find directories only
find . -type d
# Lists only directories

# Find symbolic links only
find . -type l
# Lists only symlinks

# Find broken symbolic links
find -L . -type l
# -L follows symlinks
# Reports links that can't be followed (broken)

# More type options:
# b - block devices
# c - character devices
# p - named pipes
# s - sockets

# ===== SEARCH BY SIZE =====

# Find files larger than size
find . -size +100M
# Files larger than 100 megabytes
# + means "greater than"

find . -size +1G
# Files larger than 1 gigabyte

# Find files smaller than size
find . -size -10k
# Files smaller than 10 kilobytes
# - means "less than"

# Find files of exact size
find . -size 100c
# Exactly 100 bytes
# No + or - means exact match

# Size units:
# c - bytes
# k - kilobytes
# M - megabytes
# G - gigabytes

# Find empty files
find . -type f -empty
# Files with zero bytes

# Find empty directories
find . -type d -empty
# Directories containing nothing

# ===== SEARCH BY TIME =====

# Find files modified in last N days
find . -mtime -7
# Modified in last 7 days
# -7 means "less than 7 days ago"

# Find files modified more than N days ago
find . -mtime +30
# Modified more than 30 days ago
# +30 means "more than 30 days ago"

# Find files modified exactly N days ago
find . -mtime 7
# Modified exactly 7 days ago

# Find files modified in last N minutes
find . -mmin -60
# Modified in last 60 minutes

# Find files accessed in last N days
find . -atime -7
# Accessed in last 7 days
# atime = access time (read operations)

# Find files whose status changed in last N days
find . -ctime -7
# Status changed in last 7 days
# ctime = change time (permission/ownership changes)

# Find newer than reference file
find . -newer reference.txt
# Finds files modified after reference.txt

# ===== SEARCH BY PERMISSIONS =====

# Find files with exact permissions
find . -perm 644
# Finds files with exactly 644 permissions

# Find files with at least these permissions
find . -perm -644
# At least rw-r--r--
# The - means "at least these bits"

# Find SUID files (security audit)
find / -perm -4000 -type f 2>/dev/null
# Finds all SUID executables
# Important for security

# Find SGID files
find / -perm -2000 2>/dev/null
# Finds all SGID files and directories

# Find world-writable files (security risk!)
find / -perm -002 -type f 2>/dev/null
# Files anyone can modify
# Potential security vulnerability

# Find files with no owner (orphaned files)
find / -nouser 2>/dev/null
# Files whose owner no longer exists
# Common after user deletion

# Find files with no group
find / -nogroup 2>/dev/null
# Files whose group no longer exists

# ===== SEARCH BY OWNERSHIP =====

# Find files owned by specific user
find / -user john 2>/dev/null
# All files owned by user 'john'

# Find files belonging to specific group
find / -group developers 2>/dev/null
# All files in group 'developers'

# Find files by UID
find / -uid 1000 2>/dev/null
# Files owned by user with UID 1000

# Find files by GID
find / -gid 1000 2>/dev/null
# Files in group with GID 1000

# ===== COMBINING CONDITIONS =====

# AND condition (default)
find . -name "*.txt" -size +1M
# Files ending in .txt AND larger than 1MB
# Both conditions must be true

# OR condition
find . -name "*.txt" -o -name "*.md"
# Files ending in .txt OR .md
# At least one condition must be true

# NOT condition
find . ! -name "*.txt"
# Files NOT ending in .txt
# ! means NOT

# Complex combinations
find . \( -name "*.txt" -o -name "*.md" \) -size +1M
# (txt OR md) AND larger than 1MB
# Parentheses group conditions
# Backslashes escape parentheses from shell

# ===== EXECUTING COMMANDS ON RESULTS =====

# Execute command on each result
find . -name "*.txt" -exec cat {} \;
# Runs 'cat' on each file found
# {} is replaced with filename
# \; ends the command
# Executes command once per file

# More efficient: Execute command on multiple files
find . -name "*.txt" -exec cat {} +
# Passes multiple files to single command
# + means "as many as possible"
# More efficient than \;

# Delete files found
find . -name "*.tmp" -delete
# Deletes all .tmp files
# BE VERY CAREFUL with this!
# Always test with -print first

# Interactive delete (safer)
find . -name "*.tmp" -ok rm {} \;
# -ok asks for confirmation before each deletion
# Safer than -delete or -exec rm

# Execute command with confirmation
find . -name "*.log" -ok gzip {} \;
# Asks to confirm each file compression

# Move files found
find . -name "*.bak" -exec mv {} backup/ \;
# Moves all .bak files to backup directory

# Change permissions on found files
find . -type f -name "*.sh" -exec chmod +x {} \;
# Makes all .sh files executable

# ===== LIMITING DEPTH =====

# Limit search depth
find . -maxdepth 2 -name "*.txt"
# Searches only 2 levels deep
# Faster for shallow searches

# Search only at specific depth
find . -mindepth 2 -maxdepth 2 -name "*.txt"
# Only searches exactly at depth 2
# Skips current directory and its immediate children

# Don't descend into directories
find . -maxdepth 1 -type f
# Lists only files in current directory
# Similar to ls but with find's flexibility

# ===== PRACTICAL EXAMPLES =====

# Find large files eating disk space
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}'
# Finds files over 100MB
# Displays size and path

# Find and remove old log files
find /var/log -name "*.log" -mtime +30 -delete
# Deletes logs older than 30 days
# Common maintenance task

# Find recently modified config files
find /etc -name "*.conf" -mtime -7
# Config files changed in last week
# Useful for troubleshooting

# Find files modified today
find . -type f -mtime 0
# All files modified today

# Find world-readable files with sensitive data
find /home -type f -perm -004 -name "*password*" 2>/dev/null
# Security audit: finds password files readable by everyone

# Count files by extension
find . -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
# Shows count of each file type
# Useful for analyzing directory contents

# Find duplicate filenames (not content)
find . -type f -printf '%f\n' | sort | uniq -d
# Lists filenames that appear multiple times
# Different from finding duplicate content

# Backup files modified today
find . -type f -mtime 0 -exec cp {} /backup/ \;
# Copies today's files to backup directory
```

**Pro Tips:**
- Always test `find` commands with `-print` before using `-delete` or `-exec`
- Use `2>/dev/null` to hide permission errors
- Combine with other commands using pipes for powerful operations
- `find` is more powerful but slower than `locate`

---

#### The `locate` Command - Fast File Searching

```bash
# ===== USING LOCATE =====

# locate uses a pre-built database for fast searches
# Much faster than find but database may be outdated

# Basic usage
locate filename
# Searches entire system almost instantly
# Finds all paths containing "filename"

# Case-insensitive search
locate -i readme
# Matches README, ReadMe, readme, etc.

# Limit number of results
locate -n 10 config
# Shows only first 10 matches
# Useful when many matches exist

# Count matches without listing them
locate -c "*.txt"
# Shows how many .txt files exist
# Doesn't print the list

# Show only existing files (exclude deleted)
locate -e filename
# Verifies files still exist
# Database may contain deleted files

# ===== UPDATING THE DATABASE =====

# Update locate database (requires sudo)
sudo updatedb
# Rebuilds the filename database
# Run this after creating many new files
# Automatically runs daily via cron

# Update database for specific paths
sudo updatedb --prunepaths="/path/to/exclude"
# Excludes specific paths from database
# Useful for excluding large directories

# ===== LOCATE VS FIND =====

# locate is faster but:
# - Database may be outdated
# - Can't search by permissions, size, date
# - Limited filtering options

# Use locate when:
# - You know approximate filename
# - Speed is important
# - File attributes don't matter

# Use find when:
# - You need real-time results
# - Searching by size, date, permissions
# - Need to execute commands on results
```

#### Other File Finding Commands

```bash
# ===== WHICH - Find Command Location =====

# Find location of a command
which python3
# Output: /usr/bin/python3
# Shows which executable will run

# Find all instances in PATH
which -a python
# Lists all 'python' in PATH
# Useful when multiple versions exist

# ===== WHEREIS - Find Binary, Source, and Man Pages =====

# Find binary, source, and manual locations
whereis python3
# Output: python3: /usr/bin/python3 /usr/lib/python3 /usr/share/man/man1/python3.1.gz
# More comprehensive than which

# Find only binary
whereis -b python3
# Shows just the binary location

# Find only manual page
whereis -m python3
# Shows just the man page location

# ===== TYPE - Describe Command Type =====

# Check command type
type ls
# Output: ls is aliased to `ls --color=auto'
# Shows if command is alias, function, builtin, or file

type cd
# Output: cd is a shell builtin
# Tells you cd is built into the shell

type -a python
# Shows all definitions (aliases, functions, files)

# ===== GREP - Search File Contents =====

# Search for text in files (covered more in Module 3)
grep "pattern" filename
# Finds lines containing pattern

# Recursive search in directory
grep -r "error" /var/log/
# Searches all files in /var/log

# Show filenames only
grep -l "pattern" *
# Lists files containing pattern
# Doesn't show the matches

# Count matches
grep -c "pattern" filename
# Shows number of matching lines
```

---

#### Exercise 2.5: Advanced File Finding

**Objective:** Master the `find` command and related file search tools.

1. Find all `.conf` files in `/etc` directory
2. Find files larger than 10MB in your home directory
3. Find files modified in the last 2 days
4. Find all empty files in `/tmp`
5. Find all SUID files in `/usr/bin` (requires understanding from Day 10)
6. Find all files owned by your user in `/tmp`
7. Use `locate` to find all python-related files
8. Update the locate database and search again
9. Find the location of the `bash` executable using three different commands
10. Find all symbolic links in `/usr/bin` and count them

**Expected Results:**
- You should be comfortable with find syntax
- You'll understand when to use find vs locate
- You'll be able to combine multiple search criteria

**Success Check:**
```bash
# Find large files in your home
find ~ -type f -size +10M | wc -l

# Count SUID files
find /usr/bin -perm -4000 | wc -l

# Verify bash location
which bash && whereis bash && type bash
```

---

#### Challenge 2.5: Create a File Management Script

**Objective:** Build a practical file management tool using find.

Create a script called `file_manager.sh` that:

1. **Finds and reports:**
   - Files larger than a specified size
   - Files older than specified days
   - Duplicate files (by name, not content - bonus: by content hash)
   - Empty files and directories

2. **Offers options to:**
   - Delete old temporary files safely
   - Compress large files
   - Move files to an archive directory
   - Generate a report of findings

3. **Includes safety features:**
   - Dry-run mode (show what would happen without doing it)
   - Confirmation prompts for destructive actions
   - Logging of all actions taken
   - Backup before deletion

**Requirements:**
```bash
#!/bin/bash
# Usage: ./file_manager.sh [options]
# Options:
#   --find-large SIZE     Find files larger than SIZE (e.g., 100M)
#   --find-old DAYS       Find files older than DAYS
#   --clean-tmp           Clean temporary files
#   --dry-run             Show what would happen
#   --archive PATH        Move old files to archive
```

**Bonus Challenges:**
- Add color-coded output
- Create email reports of findings
- Schedule with cron for automatic maintenance
- Add exclusion patterns (ignore certain directories)
- Find and remove duplicate files by content (use md5sum)

---

## Module Summary

Congratulations! You've completed Module 2 and gained a deep understanding of the Linux file system and permissions.

### Key Skills Acquired

✅ **File System Hierarchy**
- Understanding the purpose of major directories (/, /etc, /home, /var, etc.)
- Locating system files, logs, and configurations
- Navigating the virtual filesystems (/proc, /sys)

✅ **File Permissions**
- Reading and interpreting permission strings
- Changing permissions with chmod (numeric and symbolic)
- Understanding read, write, and execute for files and directories
- Changing ownership with chown and chgrp

✅ **Special Permissions**
- SUID (Set User ID) - running programs as file owner
- SGID (Set Group ID) - group inheritance on directories
- Sticky bit - deletion protection in shared directories
- umask - default permission masks

✅ **File Attributes**
- Immutable attribute (chattr +i) - protection from modification
- Append-only attribute (chattr +a) - log file protection
- Security applications of extended attributes

✅ **Links**
- Hard links - multiple names for same file/inode
- Symbolic links - shortcuts to files or directories
- When to use each type of link
- Finding and fixing broken links

✅ **File Searching**
- find command mastery - by name, size, time, permissions
- locate command for fast searches
- which, whereis, type for finding commands
- Combining find with exec for batch operations

### Essential Commands Learned

**Permissions:**
- `ls -l`, `chmod`, `chown`, `chgrp`, `umask`

**Special Permissions:**
- `chmod u+s` (SUID), `chmod g+s` (SGID), `chmod +t` (sticky bit)
- `lsattr`, `chattr`

**Links:**
- `ln` (hard link), `ln -s` (symbolic link), `readlink`, `unlink`

**File Finding:**
- `find`, `locate`, `updatedb`, `which`, `whereis`, `type`, `file`

### Best Practices You've Learned

1. **Never use 777 permissions** unless you understand the security implications
2. **Use 755 for executable files and directories** (most common)
3. **Use 644 for regular files** (readable by all, writable by owner)
4. **Use 600 for private files** (passwords, keys)
5. **Set SGID on shared directories** for automatic group inheritance
6. **Use sticky bit on world-writable directories** (/tmp)
7. **Prefer relative symlinks** over absolute for portability
8. **Always test find commands** before using -delete
9. **Use locate for speed**, find for accuracy
10. **Protect critical files** with immutable attribute

### Common Mistakes to Avoid

- ❌ Setting 777 on files or directories unnecessarily
- ❌ Using rm -rf on symbolic link to directory
- ❌ Forgetting -R flag when changing permissions recursively
- ❌ Not checking umask before creating sensitive files
- ❌ Using absolute paths in symlinks when relative would work
- ❌ Running find with -delete before testing with -print
- ❌ Modifying /etc/passwd or /etc/shadow directly
- ❌ Not understanding difference between hard and symbolic links

### Security Takeaways

- **Permissions are the foundation of Linux security**
- **SUID executables can be security risks** - audit regularly
- **World-writable files and directories are dangerous** - avoid unless necessary
- **Use immutable attribute** to protect critical system files
- **Regular permission audits** help find security issues
- **Principle of least privilege** - give minimum permissions needed

### Self-Assessment Checklist

Before moving to Module 3, ensure you can:

- [ ] Explain the purpose of each major directory in FHS
- [ ] Read and understand any permission string
- [ ] Set permissions using both numeric and symbolic modes
- [ ] Change file ownership and group
- [ ] Explain when to use SUID, SGID, and sticky bit
- [ ] Create and manage both hard links and symbolic links
- [ ] Find files by name, size, date, and permissions
- [ ] Use the find command with -exec
- [ ] Understand the security implications of different permissions
- [ ] Troubleshoot and fix permission issues

### Practice Recommendations

To solidify these skills:

1. **Create a test environment:** Set up various permission scenarios and experiment
2. **Audit your system:** Use find to locate SUID files and review them
3. **Practice with symlinks:** Create complex link structures and break/fix them
4. **Build scripts:** Automate permission management tasks
5. **Security review:** Check your home directory for world-readable files
6. **Study system files:** Examine permissions on /etc, /var, /usr
7. **Lab exercises:** Set up shared directories with proper permissions

### What's Next?

In **Module 3: Text Processing & Shell Scripting**, you'll learn:
- Advanced text manipulation with sed, awk, grep
- Regular expressions for pattern matching
- Writing bash scripts for automation
- Variables, conditionals, and loops
- Functions and advanced scripting techniques
- Debugging and error handling
- Building practical automation tools

---

## Final Notes

Understanding permissions is what separates Linux beginners from competent system administrators. You now have the knowledge to:
- Secure your files properly
- Set up shared workspaces
- Troubleshoot permission issues
- Audit system security
- Understand how Linux protects data

The permission system may seem complex at first, but it's actually elegant and powerful. Every security model in modern operating systems is based on concepts you've learned here.

**Remember:** With great power comes great responsibility. Always think before changing permissions on system files, and never blindly run commands as root without understanding them.

---

*End of Module 2*

**When you're ready to continue, please review this module and provide your feedback. Then say "continue" to proceed to Module 3: Text Processing & Shell Scripting.**