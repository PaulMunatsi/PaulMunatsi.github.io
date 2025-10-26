# Module 4: User & Process Management

## Overview

Understanding users and processes is fundamental to Linux system administration. Every action on a Linux system is performed by a user and executed as a process. Proper user management ensures security and organization, while process management keeps your system running smoothly.

In this module, you'll learn how to create and manage user accounts, control access with groups and sudo, monitor and control processes, and analyze system performance. These are essential skills for any Linux administrator.

**What You'll Learn:**
- User account lifecycle (create, modify, delete)
- Password management and security
- Group management and membership
- Sudo configuration and privilege escalation
- Process states and lifecycle
- Process monitoring and control
- Signal handling and process communication
- System resource monitoring (CPU, memory, disk, network)
- Performance analysis and troubleshooting
- Log file analysis

**Why This Matters:**
- User management is critical for security
- Process management prevents system issues
- Resource monitoring identifies problems early
- These skills are tested in every Linux certification
- Essential for server administration and DevOps

---

## Table of Contents

### Week 6: Users, Groups, and Processes
- [Day 20: User Management](#day-20-user-management)
- [Day 21: Group Management and Sudo](#day-21-group-management-and-sudo)
- [Day 22: Process Management](#day-22-process-management)
- [Day 23: System Monitoring](#day-23-system-monitoring)

---

## Week 6: Users, Groups, and Processes

### Day 20: User Management

Linux is a multi-user system. Understanding how to create, modify, and manage user accounts is essential for system administration.

#### Understanding Linux Users

```bash
# ===== USER TYPES =====

# Three types of users in Linux:
# 1. Root (UID 0) - superuser, can do anything
# 2. System users (UID 1-999) - run services and daemons
# 3. Regular users (UID 1000+) - human users

# ===== USER INFORMATION COMMANDS =====

# Who am I?
whoami
# Shows your current username
# Most basic command to check identity

# Detailed user information
id
# Shows: UID (User ID), GID (Group ID), and all groups
# Example output: uid=1000(john) gid=1000(john) groups=1000(john),27(sudo)

# Info about specific user
id username
# Shows information about another user
# Useful for checking group membership

id root
# Shows: uid=0(root) gid=0(root) groups=0(root)
# Root always has UID 0

# ===== WHO IS LOGGED IN =====

# Show who is currently logged in
who
# Displays: username, terminal, login time, IP address
# Example:
# john  pts/0   2024-01-15 10:30 (192.168.1.100)
# jane  pts/1   2024-01-15 11:00 (192.168.1.101)

# Detailed "who" with activity
w
# Shows what each user is doing
# Includes: uptime, load average, current command
# More informative than 'who'

# Show all login sessions
who -a
# Shows all users including system processes
# More comprehensive view

# Count logged in users
who | wc -l
# Quick count of active sessions

# ===== LOGIN HISTORY =====

# Recent login history
last
# Shows login/logout history from /var/log/wtmp
# Most recent logins first
# Includes reboots

# Limit output
last -n 10
# Shows last 10 logins only

# Specific user's login history
last username
# See when specific user logged in/out

# Failed login attempts
lastb
# Shows failed login attempts
# Requires sudo to view
# Important for security auditing

# Last login for all users
lastlog
# Shows each user's most recent login
# Helps identify unused accounts

# Specific user's last login
lastlog -u username
```

#### Understanding User Files

Before creating users, understand where user information is stored:

```bash
# ===== /etc/passwd FILE =====

# View user accounts
cat /etc/passwd
# Format: username:x:UID:GID:comment:home:shell
# Example: john:x:1000:1000:John Doe:/home/john:/bin/bash

# Breakdown of fields:
# Field 1: username
# Field 2: x (password placeholder, actual password in /etc/shadow)
# Field 3: UID (User ID)
# Field 4: GID (primary Group ID)
# Field 5: GECOS (comment/full name)
# Field 6: home directory
# Field 7: login shell

# Extract usernames only
cut -d: -f1 /etc/passwd
# Shows all usernames on system

# Find specific user
grep "^john:" /etc/passwd
# ^ ensures match at start of line
# Finds user john's entry

# Find users with specific shell
grep "/bin/bash$" /etc/passwd
# Shows users with bash shell

# Find users with UID >= 1000 (regular users)
awk -F: '$3 >= 1000 {print $1}' /etc/passwd
# Filters by UID field

# ===== /etc/shadow FILE =====

# View encrypted passwords (requires sudo)
sudo cat /etc/shadow
# Format: username:encrypted_password:last_change:min:max:warn:inactive:expire:reserved
# Example: john:$6$long_encrypted_string:18500:0:99999:7:::

# Password field meanings:
# ! or * : Account is locked
# !! : No password set yet
# $6$... : Encrypted password (SHA-512)

# Shadow file security
ls -l /etc/shadow
# Output: -rw-r----- 1 root shadow
# Only root can read, shadow group can read
# Critical security file!

# Check password status
sudo passwd -S username
# Shows: username L|P|NP date min max warn inactive
# L: locked, P: password set, NP: no password

# ===== /etc/group FILE =====

# View groups
cat /etc/group
# Format: groupname:x:GID:members
# Example: developers:x:1001:john,jane,bob

# Find groups for user
groups username
# Shows all groups user belongs to

# Find group by GID
getent group 1000
# Looks up group with GID 1000
```

#### Creating Users

```bash
# ===== ADDUSER (Debian/Ubuntu - Interactive) =====

# Create user interactively (recommended for beginners)
sudo adduser newuser
# Prompts for:
# - Password
# - Full name
# - Room number
# - Work phone
# - Home phone
# - Other info
# Then asks for confirmation

# What adduser does automatically:
# 1. Creates user account
# 2. Creates home directory (/home/newuser)
# 3. Copies files from /etc/skel
# 4. Creates group with same name as user
# 5. Sets default shell
# 6. Prompts for password
# 7. Asks for user information

# ===== USERADD (Universal - Manual) =====

# Create user manually (more control)
sudo useradd newuser
# Creates minimal account
# Does NOT create home directory by default!
# Does NOT set password!
# More flexible but requires more options

# Proper useradd with options
sudo useradd -m -s /bin/bash -c "New User" newuser
# -m: create home directory
# -s: set shell
# -c: set comment (full name)

# useradd with all common options
sudo useradd \
  -m \
  -d /home/newuser \
  -s /bin/bash \
  -c "Full Name" \
  -g users \
  -G sudo,developers \
  newuser

# Options explained:
# -m : create home directory
# -d : specify home directory path
# -s : set login shell
# -c : set comment/full name
# -g : set primary group
# -G : add to additional groups (comma-separated)

# Create system user (for services)
sudo useradd -r -s /usr/sbin/nologin serviceuser
# -r: system user (UID < 1000)
# -s /usr/sbin/nologin: cannot login interactively

# Set expiration date
sudo useradd -e 2024-12-31 tempuser
# Account expires on specified date
# Useful for temporary access

# ===== SETTING PASSWORDS =====

# Set password after creating user
sudo passwd newuser
# Prompts twice for new password
# Password requirements depend on system policy

# Force password change on first login
sudo passwd -e newuser
# -e: expire password immediately
# User must change password on next login

# Set password non-interactively (in scripts)
echo "newuser:password123" | sudo chpasswd
# ⚠️ SECURITY WARNING: Don't use in production!
# Password visible in command history
# Use for testing/automation only

# Generate random password
PASSWORD=$(openssl rand -base64 12)
echo "newuser:$PASSWORD" | sudo chpasswd
echo "Password for newuser: $PASSWORD"

# ===== PRACTICAL USER CREATION =====

#!/bin/bash
# Script to create user properly

USERNAME=$1

# Check if username provided
if [ -z "$USERNAME" ]; then
    echo "Usage: $0 username"
    exit 1
fi

# Check if user already exists
if id "$USERNAME" &>/dev/null; then
    echo "User $USERNAME already exists"
    exit 1
fi

# Create user
sudo useradd -m -s /bin/bash -c "Created by script" "$USERNAME"

# Set password
sudo passwd "$USERNAME"

# Add to developers group (if exists)
if getent group developers > /dev/null; then
    sudo usermod -aG developers "$USERNAME"
fi

echo "User $USERNAME created successfully"
echo "Home directory: $(eval echo ~$USERNAME)"
```

#### Modifying Users

```bash
# ===== USERMOD COMMAND =====

# Change user's shell
sudo usermod -s /bin/zsh username
# -s: sets login shell
# User will use zsh on next login

# Change user's home directory
sudo usermod -d /new/home/path username
# -d: sets new home directory
# Doesn't move files! Use -m with -d to move

# Move home directory and change path
sudo usermod -d /new/path -m username
# -m: move contents to new location
# Both changes home and moves files

# Change username
sudo usermod -l newname oldname
# -l: login name
# Changes username but not home directory name
# Consider renaming home directory manually

# Add user to group (append)
sudo usermod -aG groupname username
# -a: append (crucial!)
# -G: supplementary groups
# Without -a, replaces all groups!

# ❌ WRONG: sudo usermod -G newgroup username
# This REMOVES user from all other groups!

# ✅ RIGHT: sudo usermod -aG newgroup username
# This ADDS user to newgroup, keeps existing groups

# Add user to multiple groups
sudo usermod -aG group1,group2,group3 username
# Comma-separated list
# No spaces between groups

# Set primary group
sudo usermod -g groupname username
# -g: primary group (lowercase)
# User's new files will belong to this group

# Lock user account
sudo usermod -L username
# -L: lock account
# Prepends ! to encrypted password
# User cannot login but cron jobs still run

# Unlock user account
sudo usermod -U username
# -U: unlock account
# Removes ! from password

# Set account expiration
sudo usermod -e 2024-12-31 username
# Account expires at midnight on date
# User cannot login after expiration

# Remove expiration
sudo usermod -e "" username
# Empty string removes expiration

# Change user's comment/full name
sudo usermod -c "New Full Name" username
# Updates GECOS field

# ===== PASSWORD MANAGEMENT =====

# Change password
sudo passwd username
# Prompts for new password

# Force user to change password
sudo passwd -e username
# Password expires immediately
# User must change on next login

# Lock account (disable password)
sudo passwd -l username
# Alternative to usermod -L
# Locks the password

# Unlock account
sudo passwd -u username
# Unlocks the password

# Delete password (allow login without password)
sudo passwd -d username
# ⚠️ DANGEROUS! Creates passwordless account
# Only use for specific scenarios

# Set password aging
sudo passwd -n 7 -x 90 -w 7 username
# -n 7: minimum 7 days between changes
# -x 90: maximum 90 days before must change
# -w 7: warning 7 days before expiration

# View password status
sudo passwd -S username
# Shows: status, date, min, max, warn, inactive

# ===== CHAGE COMMAND (Advanced Password Aging) =====

# Interactive password aging editor
sudo chage username
# Prompts for all aging parameters

# Set password expiration date
sudo chage -E 2024-12-31 username
# Account expires on date

# Force password change on next login
sudo chage -d 0 username
# Sets last change to epoch (1970)
# Forces immediate change

# Set minimum days between changes
sudo chage -m 7 username
# User cannot change password for 7 days

# Set maximum days before must change
sudo chage -M 90 username
# Password expires after 90 days

# Set warning days
sudo chage -W 7 username
# Warn user 7 days before expiration

# View aging information
sudo chage -l username
# Shows all password aging details

# ===== PRACTICAL EXAMPLES =====

# Add user to sudo group
sudo usermod -aG sudo username
# Now user can use sudo

# Change shell to zsh
sudo usermod -s /bin/zsh username
# Install zsh first if needed

# Lock inactive user
sudo usermod -L username
sudo usermod -e 1 username
# Locks and sets to expire

# Create temporary access
sudo useradd -m -e 2024-02-01 tempuser
sudo passwd tempuser
# Account auto-expires on date
```

#### Deleting Users

```bash
# ===== DELUSER (Debian/Ubuntu) =====

# Delete user (keeps home directory)
sudo deluser username
# Removes user from /etc/passwd
# Home directory remains in /home

# Delete user and home directory
sudo deluser --remove-home username
# Removes user AND home directory
# All user files are deleted!

# Delete user and all files
sudo deluser --remove-all-files username
# Removes home AND all files owned by user
# Even files outside home directory
# ⚠️ DANGEROUS - use carefully!

# ===== USERDEL (Universal) =====

# Delete user (keeps home and mail)
sudo userdel username
# Minimal deletion
# Leaves home directory

# Delete user and home directory
sudo userdel -r username
# -r: remove home directory and mail spool
# Most common usage

# Force delete even if user is logged in
sudo userdel -f username
# -f: force deletion
# ⚠️ Can cause issues if user has running processes

# ===== SAFE USER DELETION PROCEDURE =====

#!/bin/bash
# Safe user deletion script

USERNAME=$1

# Check if user exists
if ! id "$USERNAME" &>/dev/null; then
    echo "User $USERNAME does not exist"
    exit 1
fi

# Check if user is logged in
if who | grep -q "^$USERNAME "; then
    echo "User $USERNAME is currently logged in"
    echo "Log them out first!"
    exit 1
fi

# Check for running processes
if pgrep -u "$USERNAME" > /dev/null; then
    echo "User $USERNAME has running processes:"
    ps -u "$USERNAME"
    read -p "Kill these processes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo pkill -9 -u "$USERNAME"
    else
        echo "Cannot delete user with running processes"
        exit 1
    fi
fi

# Backup home directory
echo "Backing up home directory..."
sudo tar czf "/tmp/${USERNAME}_backup_$(date +%Y%m%d).tar.gz" "/home/$USERNAME"

# Delete user
echo "Deleting user..."
sudo userdel -r "$USERNAME"

echo "User $USERNAME deleted successfully"
echo "Backup saved to /tmp/${USERNAME}_backup_$(date +%Y%m%d).tar.gz"

# ===== FIND FILES OWNED BY DELETED USER =====

# If you deleted user without -r, find their files
sudo find / -user 1000 2>/dev/null
# Replace 1000 with the user's UID
# Shows all files still owned by deleted user

# Find and delete files owned by UID
sudo find / -user 1000 -delete 2>/dev/null
# ⚠️ DANGEROUS - deletes all files!
# Better: move to archive first

# Find and change ownership
sudo find / -user 1000 -exec chown newowner {} \; 2>/dev/null
# Transfers ownership to another user
```

#### Switching Users

```bash
# ===== SU COMMAND (Switch User) =====

# Switch to another user
su username
# Prompts for username's password
# Keeps current environment
# $HOME still points to your home

# Switch with login shell (cleaner environment)
su - username
# Dash (-) provides full login
# Changes to user's home directory
# Loads user's environment variables
# Preferred method

# Switch to root (if you know root password)
su
# OR
su -
# Prompts for root password
# Becomes root user

# Switch to root with current environment
su root
# Less common, keeps your PATH and variables

# Run single command as another user
su - username -c "command"
# Executes command as username
# Returns to your user after command completes

# Example: run ls as another user
su - john -c "ls -la /home/john"

# ===== SUDO COMMAND (Preferred Method) =====

# Run command as root
sudo command
# Prompts for YOUR password (not root's)
# Temporary root privileges
# Action is logged

# Interactive root shell
sudo -i
# Opens root shell
# Full root environment
# Like su -

# Root shell with current environment
sudo -s
# Less clean than sudo -i
# Keeps your environment variables

# Run command as different user
sudo -u username command
# -u: specify user
# Prompts for YOUR password
# Useful for running commands as service users

# Example: run command as www-data
sudo -u www-data whoami
# Output: www-data

# Run shell as another user
sudo -u username -s
# Opens shell as specified user

# ===== EXIT USER SESSIONS =====

# Exit su or sudo -i session
exit
# Returns to previous user

# Log out completely
logout
# Ends your entire session
# Alternative to exit

# Check how many user levels deep
echo $SHLVL
# Shows shell nesting level
# 1 = original login
# 2+ = nested su/sudo sessions

# ===== PRACTICAL EXAMPLES =====

# Quick root command then return
sudo apt update
# You're prompted for password
# Command runs as root
# You remain as regular user

# Multiple sudo commands (password cached)
sudo apt update
sudo apt upgrade
# Second command doesn't prompt (5 minute cache by default)

# Force password prompt
sudo -k
# Invalidates timestamp
# Next sudo requires password

# Run script as root
sudo bash script.sh
# Entire script runs with root privileges

# Edit file as root
sudo nano /etc/hosts
# Opens file with root permissions
# You can save changes

# Switch to service account
sudo -u postgres psql
# Opens PostgreSQL shell as postgres user
# Common pattern for database administration
```

---

#### Exercise 4.1: User Management Practice

**Objective:** Master user creation, modification, and deletion.

1. **Create User:**
   - Create a new user called `testuser`
   - Set a password for testuser
   - Verify user was created in `/etc/passwd`
   - Check user's home directory was created

2. **Modify User:**
   - Change testuser's full name (comment field)
   - Add testuser to a secondary group
   - Change testuser's shell to `/bin/zsh` (if installed)
   - Set password expiration to 90 days

3. **Switch Users:**
   - Switch to testuser using `su`
   - Verify you're testuser with `whoami`
   - Check your groups with `groups`
   - Return to your original user

4. **User Information:**
   - View testuser's entry in `/etc/passwd`
   - Check testuser's password status
   - See when testuser last logged in
   - List all files owned by testuser

5. **Clean Up:**
   - Delete testuser including home directory
   - Verify user no longer exists
   - Check that home directory was removed

**Expected Results:**
- Comfort creating and managing users
- Understanding of user files
- Ability to modify user properties
- Safe user deletion practices

**Success Check:**
```bash
# Verify user creation
id testuser && echo "User exists" || echo "User not found"

# Check home directory
ls -ld /home/testuser

# Verify groups
groups testuser

# Confirm deletion
id testuser 2>/dev/null || echo "User successfully deleted"
```

---

#### Challenge 4.1: Multi-User Team Setup

**Objective:** Set up a team development environment with proper user management.

Create a multi-user environment for a development team:

**Requirements:**

1. **Create Three Developers:**
   - Create users: dev1, dev2, dev3
   - Set appropriate passwords
   - All should have bash shell
   - Set full names for each

2. **Create Team Group:**
   - Create group called `developers`
   - Add all three developers to this group
   - Verify group membership

3. **Create Shared Directory:**
   - Create `/home/shared/projects`
   - Set group ownership to `developers`
   - Set permissions so:
     - Group members can read, write, execute
     - Others have no access
   - Set SGID bit so new files inherit group

4. **Set Up User Environments:**
   - Create `.bash_aliases` for each user
   - Add useful aliases
   - Create a shared script in `/home/shared/scripts`

5. **Documentation:**
   - Create a file listing all team members
   - Include their UIDs, GIDs, and groups
   - Document the shared directory structure

**Bonus Challenges:**
- Set password aging policies (90-day expiration)
- Create a script to add new team members
- Implement naming conventions
- Create team-specific environment variables

**Expected Output:**
```
Team Setup Complete:
- Users: dev1, dev2, dev3
- Group: developers (GID: 1001)
- Shared directory: /home/shared/projects
- Permissions: drwxrws--- (2770)
- All users can collaborate in shared space
```

---

### Day 21: Group Management and Sudo

Groups organize users and control access to resources. The sudo system allows controlled privilege escalation for administrative tasks.

#### Understanding Groups

```bash
# ===== GROUP BASICS =====

# Every user has:
# - Primary group (GID in /etc/passwd)
# - Zero or more secondary groups

# View your groups
groups
# Shows all groups you belong to
# First group listed is your primary group

# View groups for specific user
groups username
# Shows that user's groups

# View all groups on system
cat /etc/group
# Format: groupname:x:GID:member1,member2,member3

# Get group information by name
getent group groupname
# Queries group database
# More reliable than cat /etc/group

# Get group information by GID
getent group 1000
# Finds group with GID 1000

# List all groups
getent group | cut -d: -f1
# Extracts just group names

# Find GID for group
getent group groupname | cut -d: -f3
# Extracts GID number

# ===== GROUP FILE STRUCTURE =====

# /etc/group format:
# groupname:password:GID:member_list

# Example:
# developers:x:1001:john,jane,bob

# Field 1: Group name
# Field 2: Password (x = shadowed, rarely used)
# Field 3: GID (Group ID)
# Field 4: Member list (comma-separated)

# ===== PRIMARY VS SECONDARY GROUPS =====

# Primary group:
# - Specified in /etc/passwd (4th field)
# - New files created by user belong to this group
# - User always has one primary group

# Secondary groups:
# - Listed in /etc/group
# - User can belong to multiple
# - Provide additional access

# Check user's primary group
id -gn username
# Shows primary group name

# Check user's GID
id -g username
# Shows primary group ID number

# Check all groups
id -Gn username
# Shows all group names

# Check all GIDs
id -G username
# Shows all group ID numbers
```

#### Creating and Managing Groups

```bash
# ===== CREATING GROUPS =====

# Create a new group
sudo groupadd developers
# Creates group with next available GID
# Group added to /etc/group

# Create group with specific GID
sudo groupadd -g 1500 mygroup
# -g: specify GID
# Useful for maintaining consistent GIDs across systems

# Create system group (GID < 1000)
sudo groupadd -r servicegroup
# -r: system group
# Gets GID from system range

# ===== ADDING USERS TO GROUPS =====

# Add user to group (gpasswd method)
sudo gpasswd -a username groupname
# -a: add user
# Preferred method
# Cleaner syntax

# Example: Add john to developers
sudo gpasswd -a john developers

# Add user to group (usermod method)
sudo usermod -aG groupname username
# -a: append (crucial!)
# -G: supplementary groups
# Can add to multiple groups at once

# Example: Add jane to multiple groups
sudo usermod -aG developers,admins,sudo jane

# ===== REMOVING USERS FROM GROUPS =====

# Remove user from group (gpasswd)
sudo gpasswd -d username groupname
# -d: delete user from group
# Preferred method

# Example:
sudo gpasswd -d john developers

# Remove user from group (usermod)
# WARNING: This replaces ALL secondary groups!
sudo usermod -G newgrouplist username
# Without -a flag, replaces all groups
# Be very careful!

# ===== CHANGING GROUP PROPERTIES =====

# Rename group
sudo groupmod -n newname oldname
# -n: new name
# Changes group name, keeps GID

# Change group GID
sudo groupmod -g 1600 groupname
# Changes GID
# Files with old GID keep old GID!
# May need to change file ownership

# ===== DELETING GROUPS =====

# Delete group
sudo groupdel groupname
# Removes group from /etc/group
# Does not delete users
# Files owned by group keep the GID (but group name is gone)

# Cannot delete if it's a user's primary group
# Must change user's primary group first

# Check before deleting
getent group groupname
# Verify group exists and see members

# Find files owned by group before deleting
find / -group groupname 2>/dev/null
# Shows all files belonging to group
# Consider changing ownership first

# ===== CHANGING GROUP TEMPORARILY =====

# Switch primary group temporarily
newgrp groupname
# Opens new shell with different primary group
# New files will belong to this group
# Type 'exit' to return to normal

# Example:
newgrp developers
touch file.txt    # Belongs to developers group
exit              # Return to normal primary group

# ===== GROUP ADMINISTRATION =====

# Set group administrator
sudo gpasswd -A username groupname
# -A: make username group administrator
# Allows user to add/remove group members

# Set group password (rarely used)
sudo gpasswd groupname
# Prompts for group password
# Members can use newgrp without password

# Remove group password
sudo gpasswd -r groupname
# -r: remove password

# ===== PRACTICAL EXAMPLES =====

# Create development team group
sudo groupadd developers
sudo gpasswd -a john developers
sudo gpasswd -a jane developers
sudo gpasswd -a bob developers

# Create shared directory
sudo mkdir -p /home/shared/projects
sudo chgrp developers /home/shared/projects
sudo chmod 2775 /home/shared/projects
# 2775: SGID + group read/write/execute

# Verify setup
ls -ld /home/shared/projects
getent group developers

# Create admin group with existing users
sudo groupadd admins
for user in alice bob charlie; do
    sudo usermod -aG admins $user
done
```

#### Understanding and Configuring Sudo

The sudo system provides controlled privilege escalation, allowing regular users to perform administrative tasks with proper authorization.

```bash
# ===== SUDO BASICS =====

# Run command as root
sudo command
# Prompts for YOUR password (not root's)
# Executes command with root privileges
# Action is logged to /var/log/auth.log

# Why sudo is better than su:
# 1. Don't need root password
# 2. Limited time window (default 15 minutes)
# 3. All actions are logged
# 4. Granular control (specific commands only)
# 5. Easier to audit

# ===== CHECKING SUDO ACCESS =====

# List your sudo privileges
sudo -l
# Shows what commands you can run with sudo
# Useful for checking permissions

# Example output:
# User john may run the following commands:
#     (ALL : ALL) ALL

# List another user's privileges (requires sudo)
sudo -l -U username
# -U: specify user
# Shows what that user can sudo

# Test if you have sudo access
sudo -v
# Validates credentials
# Updates timestamp
# Exit code 0 if successful

# ===== SUDO CONFIGURATION =====

# Edit sudoers file (ALWAYS use visudo!)
sudo visudo
# Opens /etc/sudoers in safe editor
# Checks syntax before saving
# Prevents breaking sudo access

# ⚠️ NEVER edit /etc/sudoers directly!
# sudo nano /etc/sudoers  # WRONG!
# sudo visudo             # RIGHT!

# ===== SUDOERS FILE SYNTAX =====

# Basic syntax:
# user/group  hosts=(run_as) commands

# Give user full sudo access
username ALL=(ALL:ALL) ALL
# username: the user
# ALL: from all hosts
# (ALL:ALL): can run as any user and group
# ALL: can run all commands

# Give group full sudo access
%groupname ALL=(ALL:ALL) ALL
# % prefix indicates group
# All group members get access

# Allow specific commands only
username ALL=(ALL) /usr/bin/systemctl restart apache2, /usr/bin/systemctl status apache2
# User can only restart and check apache2 status
# Must use full paths to commands

# No password required
username ALL=(ALL) NOPASSWD: ALL
# User never prompted for password
# ⚠️ SECURITY RISK - use carefully!

# Specific commands without password
username ALL=(ALL) NOPASSWD: /usr/bin/apt update, /usr/bin/apt upgrade
# Can run these commands without password
# Other commands still require password

# Run as specific user
username ALL=(otheruser) ALL
# Can run commands as otheruser
# Example: sudo -u otheruser command

# Command aliases for readability
Cmnd_Alias SOFTWARE = /usr/bin/apt, /usr/bin/dpkg
username ALL=(ALL) SOFTWARE
# Creates reusable command group

# User aliases
User_Alias ADMINS = john, jane, bob
ADMINS ALL=(ALL:ALL) ALL
# Multiple users with same permissions

# ===== COMMON SUDOERS EXAMPLES =====

# Web admin (can manage apache)
Cmnd_Alias APACHE = /usr/bin/systemctl restart apache2, \
                    /usr/bin/systemctl reload apache2, \
                    /usr/bin/systemctl status apache2
webadmin ALL=(ALL) APACHE

# Database admin (can manage mysql)
Cmnd_Alias MYSQL = /usr/bin/systemctl restart mysql, \
                   /usr/bin/systemctl status mysql, \
                   /usr/bin/mysql
dbadmin ALL=(ALL) MYSQL

# Backup operator
Cmnd_Alias BACKUP = /usr/bin/rsync, /usr/bin/tar
backupuser ALL=(ALL) NOPASSWD: BACKUP

# Allow group to use apt
%developers ALL=(ALL) NOPASSWD: /usr/bin/apt update, /usr/bin/apt upgrade

# ===== SUDO OPTIONS =====

# Defaults can modify sudo behavior
# In /etc/sudoers or /etc/sudoers.d/:

# Change timeout (default 15 minutes)
Defaults timestamp_timeout=30
# Minutes before password required again

# Require password every time
Defaults timestamp_timeout=0
# Always prompt for password

# Preserve environment variables
Defaults env_keep += "HOME"
# Keeps specified variables

# Require sudo for specific commands
Defaults !authenticate
# Never require password (dangerous!)

# Log sudo commands to specific file
Defaults logfile="/var/log/sudo.log"
# Custom log location

# Send email on sudo usage
Defaults mail_always
Defaults mailto="admin@example.com"
# Email notifications

# ===== SUDOERS.D DIRECTORY =====

# Create modular sudo config
sudo visudo -f /etc/sudoers.d/developers
# Create separate file for developers
# Cleaner than editing main sudoers file

# Example /etc/sudoers.d/developers:
%developers ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart apache2

# Files in /etc/sudoers.d/ must:
# - End in .conf or have no extension
# - Have proper permissions (0440)
# - Not contain . or ~ in filename

# ===== SUDO USAGE EXAMPLES =====

# Run command as root
sudo apt update

# Run command as different user
sudo -u www-data touch /var/www/file.txt
# Creates file owned by www-data

# Become root interactively
sudo -i
# Full root environment

# Become root keeping environment
sudo -s
# Root shell with your environment

# Edit file as root
sudo -e /etc/hosts
# OR
sudoedit /etc/hosts
# Uses your $EDITOR
# Safer than sudo nano

# Run last command with sudo
sudo !!
# !! expands to last command
# Useful when you forget sudo

# Clear sudo timestamp (force password next time)
sudo -k
# Invalidates cached credentials

# ===== SECURITY BEST PRACTICES =====

# 1. Use visudo always
# 2. Grant minimum necessary privileges
# 3. Use command paths, not wildcards
# 4. Be careful with NOPASSWD
# 5. Use groups, not individual users when possible
# 6. Review sudo logs regularly
# 7. Test sudo configs before logging out
# 8. Document who has what access

# ===== VIEWING SUDO LOGS =====

# View sudo usage (Ubuntu/Debian)
sudo grep sudo /var/log/auth.log

# Recent sudo commands
sudo grep sudo /var/log/auth.log | tail -20

# Specific user's sudo activity
sudo grep "sudo.*username" /var/log/auth.log

# Failed sudo attempts
sudo grep "sudo.*incorrect password" /var/log/auth.log

# Using journalctl (systemd systems)
sudo journalctl _COMM=sudo
# Shows all sudo activity

# Recent sudo activity
sudo journalctl _COMM=sudo --since "1 hour ago"

# Specific user
sudo journalctl _COMM=sudo | grep username
```

---

#### Exercise 4.2: Group and Sudo Management

**Objective:** Master group administration and sudo configuration.

1. **Group Creation:**
   - Create a group called `admins`
   - Create a group called `developers`
   - Verify groups were created

2. **Group Membership:**
   - Add your user to both groups
   - Create a test user and add to developers
   - Verify group memberships with `groups`

3. **Sudo Access:**
   - Check your current sudo privileges
   - View the sudoers file (with visudo)
   - Understand the default sudo configuration

4. **Test Sudo:**
   - Run a command that requires root (without sudo)
   - Run the same command with sudo
   - Check sudo logs for your activity

5. **Temporary Group Switch:**
   - Use `newgrp` to switch to developers group
   - Create a file and check its group ownership
   - Exit back to your normal group

**Expected Results:**
- Comfort creating and managing groups
- Understanding of group membership
- Ability to check and modify sudo access
- Understanding of sudo logs

**Success Check:**
```bash
# Verify group membership
groups | grep admins && echo "In admins group"

# Test sudo
sudo -l | grep "(ALL)" && echo "Have sudo access"

# Check sudo log
sudo grep sudo /var/log/auth.log | tail -1
```

---

#### Challenge 4.2: Custom Sudo Configuration

**Objective:** Create granular sudo access for different roles.

Set up role-based sudo access for a team:

**Roles to Create:**

1. **Web Administrator (webadmin user):**
   - Can start/stop/restart Apache
   - Can reload Nginx
   - Can view service status
   - NO password required for these commands

2. **Database Administrator (dbadmin user):**
   - Can start/stop/restart MySQL/PostgreSQL
   - Can run mysql and psql commands
   - Password required

3. **Backup Operator (backupuser):**
   - Can run rsync and tar
   - Can read any file (for backup purposes)
   - NO password required

4. **Developer Group:**
   - Can install packages with apt
   - Can restart development services
   - Password required

**Requirements:**
- Use /etc/sudoers.d/ for modular configuration
- Create command aliases for readability
- Test each role's access
- Document what each role can do
- Verify with `sudo -l -U username`

**Bonus Challenges:**
- Add logging for specific sudo commands
- Set different timeout values per role
- Create email alerts for certain sudo actions
- Implement sudo without password for emergency commands only

**Testing Script:**
```bash
#!/bin/bash
# Test sudo configuration

echo "Testing webadmin..."
sudo -u webadmin sudo -l | grep systemctl

echo "Testing dbadmin..."
sudo -u dbadmin sudo -l | grep mysql

echo "Testing backupuser..."
sudo -u backupuser sudo -l | grep rsync

echo "All roles configured correctly!"
```

---

### Day 22: Process Management

Every running program in Linux is a process. Understanding how to view, control, and manage processes is essential for system administration.

#### Understanding Processes

```bash
# ===== PROCESS BASICS =====

# Every process has:
# - PID (Process ID): unique number
# - PPID (Parent Process ID): who started it
# - UID (User ID): who owns it
# - State: running, sleeping, stopped, zombie
# - Priority: nice value (-20 to 19)
# - Memory usage
# - CPU usage

# ===== VIEWING PROCESSES =====

# Show processes in current shell
ps
# Minimal output
# Shows only your processes in current terminal

# Show all your processes
ps u
# u: user-oriented format
# More detailed information

# Show all processes (BSD style - most common)
ps aux
# a: all users' processes
# u: user-oriented format
# x: processes without controlling terminal

# Output columns explained:
# USER: process owner
# PID: process ID
# %CPU: CPU usage percentage
# %MEM: memory usage percentage
# VSZ: virtual memory size (KB)
# RSS: resident set size (physical memory in KB)
# TTY: controlling terminal (? = no terminal)
# STAT: process state
# START: start time
# TIME: cumulative CPU time
# COMMAND: command name and arguments

# Process states (STAT column):
# R: running or runnable
# S: sleeping (waiting for event)
# D: uninterruptible sleep (usually I/O)
# T: stopped (Ctrl+Z)
# Z: zombie (finished but not reaped)
# <: high priority
# N: low priority
# +: foreground process
# s: session leader
# l: multi-threaded

# Show all processes (Unix style)
ps -ef
# -e: all processes
# -f: full format
# Alternative to ps aux

# Process tree (show parent-child relationships)
ps auxf
# f: forest/tree view
# Shows process hierarchy with ASCII art

# Better process tree
pstree
# Visual tree of all processes
# Shows parent-child relationships clearly

# Specific user's processes
ps -u username
# Shows all processes owned by user

# Processes using specific file
lsof /path/to/file
# Lists processes with file open
# Useful for "file in use" errors

# Processes listening on port
sudo lsof -i :80
# Shows processes listening on port 80
# Useful for finding what's using a port

# ===== FINDING PROCESSES =====

# Search for process by name
ps aux | grep processname
# Simple but shows the grep command too

# Better: use pgrep
pgrep processname
# Returns only PIDs
# Cleaner output

# pgrep with full command
pgrep -a processname
# -a: shows full command line

# Find PID by exact name
pidof processname
# Returns space-separated PIDs
# Only works with exact process name

# Example:
pidof firefox
# Output: 1234 5678 (if multiple Firefox instances)

# Find your current shell's PID
echo $$
# $$ is special variable for current process PID

# Find parent process PID
echo $PPID
# $PPID is parent process ID

# ===== REAL-TIME PROCESS MONITORING =====

# Interactive process viewer (most common)
top
# Real-time view, updates every 3 seconds
# Press 'q' to quit

# top keyboard shortcuts:
# k: kill process (prompts for PID)
# r: renice (change priority)
# M: sort by memory usage
# P: sort by CPU usage
# u: filter by user
# 1: show individual CPU cores
# h: help
# q: quit

# Better interactive viewer
htop
# More user-friendly than top
# Install: sudo apt install htop
# Mouse support
# F keys for operations
# Tree view
# Search functionality

# Monitor specific user
top -u username
# Shows only processes for specified user

# Run top in batch mode (non-interactive)
top -b -n 1
# -b: batch mode
# -n 1: one iteration
# Useful for scripts or logging

# ===== PROCESS INFORMATION =====

# Detailed info about specific process
ps -p PID -o pid,ppid,cmd,%mem,%cpu
# -p PID: specify process
# -o: choose output fields

# All info about process
ps -fp PID
# -f: full format

# Process environment variables
sudo cat /proc/PID/environ | tr '\0' '\n'
# Shows environment for process
# Requires appropriate permissions

# Process command line
cat /proc/PID/cmdline
# Shows exact command used to start process

# Process current working directory
sudo ls -l /proc/PID/cwd
# Symbolic link to process's working directory

# Files opened by process
sudo ls -l /proc/PID/fd
# File descriptors

# More detailed with lsof
sudo lsof -p PID
# Lists all files, sockets, libraries used by process

# ===== PRACTICAL QUERIES =====

# Find all apache processes
ps aux | grep apache2
# OR
pgrep -a apache2

# Count processes for user
ps -u username | wc -l

# Find processes using most memory
ps aux --sort=-%mem | head -10
# --sort: sort by field
# -: descending order
# Top 10 memory users

# Find processes using most CPU
ps aux --sort=-%cpu | head -10
# Top 10 CPU users

# Find zombie processes
ps aux | grep 'Z'
# Z in STAT column indicates zombie

# Find processes in uninterruptible sleep (stuck on I/O)
ps aux | grep 'D'
# D state often indicates disk problems

# Show process count by user
ps aux | awk '{print $1}' | sort | uniq -c | sort -rn
# Counts processes per user

# Find long-running processes
ps -eo pid,etime,cmd --sort=-etime | head -10
# etime: elapsed time
# Shows oldest processes first
```

#### Background and Foreground Jobs

```bash
# ===== RUNNING PROCESSES IN BACKGROUND =====

# Start process in background
command &
# & sends process to background immediately
# Returns job number and PID
# Example:
sleep 100 &
# Output: [1] 12345
#         ^   ^
#      job#  PID

# Run multiple commands in background
command1 & command2 & command3 &
# All three run simultaneously

# ===== JOB CONTROL =====

# List background jobs
jobs
# Shows job number, status, command
# Example output:
# [1]+ Running  sleep 100 &
# [2]- Running  sleep 200 &

# Jobs with PIDs
jobs -l
# -l: includes PID
# [1]  12345 Running  sleep 100 &

# Bring job to foreground
fg %1
# %1: job number 1
# Process comes to foreground
# You can interact with it

# Bring most recent job to foreground
fg
# No argument = most recent background job

# Continue job in background
bg %1
# If process was stopped with Ctrl+Z
# Continues running in background

# Continue most recent stopped job
bg
# Without argument

# ===== SUSPENDING PROCESSES =====

# Suspend foreground process
# Press: Ctrl+Z
# Stops process (doesn't kill it)
# Returns to shell
# Process state becomes T (stopped)

# Example workflow:
vim file.txt
# Press Ctrl+Z
# [1]+ Stopped  vim file.txt
jobs
# [1]+ Stopped  vim file.txt
fg
# Returns to vim

# ===== DISOWNING JOBS =====

# Disown job (won't be killed when shell exits)
disown %1
# Removes job from job table
# Process continues even after logout

# Disown all jobs
disown -a
# -a: all jobs

# Start process immune to hangup
nohup command &
# nohup: no hangup
# Output goes to nohup.out
# Process continues after logout

# Example:
nohup python script.py &
# Script runs even after you log out
# Output in nohup.out

# Redirect nohup output
nohup command > output.log 2>&1 &
# Cleaner than default nohup.out

# ===== PRACTICAL EXAMPLES =====

# Long compilation in background
make -j4 & 
# Compiles in background
# You can do other work

# Multiple long tasks
for i in {1..5}; do
    ./process_file_$i.sh &
done
# Runs 5 scripts simultaneously

# Background with notification
long_command && notify-send "Done!" &
# Sends desktop notification when complete
```

#### Process Priority and Nice Values

```bash
# ===== UNDERSTANDING NICE VALUES =====

# Nice values: -20 to 19
# -20: highest priority
#   0: default priority
#  19: lowest priority

# Lower nice value = higher priority = more CPU time
# Only root can set negative nice values

# ===== STARTING PROCESS WITH NICE =====

# Start with nice value
nice -n 10 command
# -n 10: nice value 10 (lower priority)
# Good for background tasks

# Examples:
nice -n 19 ./backup.sh
# Lowest priority - won't slow down system

nice -n -20 important_task
# Highest priority (requires root)

# Default nice is 0
nice command
# Runs with nice value 10 (default increment)

# ===== CHANGING NICE VALUE OF RUNNING PROCESS =====

# Change nice value (requires appropriate permissions)
renice -n 5 -p PID
# -n: new nice value
# -p: process ID

# Make process lower priority
sudo renice 10 -p 12345
# Sets nice to 10

# Make process higher priority (requires root)
sudo renice -5 -p 12345
# Sets nice to -5

# Renice all processes for user
sudo renice 10 -u username
# All user's processes get nice 10

# Renice process group
sudo renice 10 -g GID
# All processes in group

# ===== VIEWING PRIORITY =====

# View process nice value
ps -o pid,nice,comm -p PID

# View all processes with nice values
ps axo pid,nice,comm

# In top/htop
# NI column shows nice value
# PR shows priority

# ===== PRACTICAL EXAMPLES =====

# Background backup with low priority
nice -n 19 tar czf backup.tar.gz /data &
# Won't impact other processes

# Video encoding (CPU-intensive)
nice -n 15 ffmpeg -i input.mp4 output.mp4
# Lower priority, won't freeze system

# Batch processing
for file in *.raw; do
    nice -n 10 convert "$file" "${file%.raw}.jpg" &
done
# All conversions run at lower priority
```

#### Killing Processes (Signals)

```bash
# ===== SIGNALS =====

# Signals are messages sent to processes
# Common signals:
# SIGTERM (15): Graceful termination (default)
# SIGKILL (9): Force kill (cannot be caught)
# SIGHUP (1): Hangup, often reloads config
# SIGINT (2): Interrupt (Ctrl+C)
# SIGSTOP (19): Stop process (cannot be caught)
# SIGCONT (18): Continue stopped process

# ===== KILL COMMAND =====

# Send signal to process
kill PID
# Default: sends SIGTERM (15)
# Polite request to terminate
# Process can catch and cleanup

# Force kill
kill -9 PID
# Sends SIGKILL
# Immediate termination
# Process cannot catch or ignore
# ⚠️ Use as last resort!

# Specific signal by number
kill -15 PID      # SIGTERM (graceful)
kill -9 PID       # SIGKILL (force)
kill -1 PID       # SIGHUP (reload config)
kill -2 PID       # SIGINT (interrupt)

# Specific signal by name
kill -TERM PID
kill -KILL PID
kill -HUP PID

# List all signals
kill -l
# Shows all signal names and numbers

# ===== KILLALL COMMAND =====

# Kill all processes by name
killall processname
# Sends SIGTERM to all matching processes

# Force kill all
killall -9 processname
# Sends SIGKILL to all

# Interactive confirmation
killall -i processname
# -i: asks before killing each process

# Only kill processes owned by user
killall -u username processname
# Safer than killing all matches

# ===== PKILL COMMAND =====

# Kill by pattern
pkill processname
# More flexible than killall
# Partial name matching

# Kill all firefox processes
pkill firefox
# Matches firefox, firefox-bin, etc.

# Kill with specific signal
pkill -9 firefox
# Force kill all firefox processes

# Kill processes for specific user
pkill -u username
# Kills all user's processes
# ⚠️ DANGEROUS!

# Kill by other criteria
pkill -t pts/0
# Kills processes on specific terminal

# ===== SAFE KILLING PROCEDURE =====

#!/bin/bash
# Graceful process termination script

PID=$1

if [ -z "$PID" ]; then
    echo "Usage: $0 PID"
    exit 1
fi

# Check if process exists
if ! ps -p $PID > /dev/null; then
    echo "Process $PID does not exist"
    exit 1
fi

echo "Attempting graceful termination..."
kill -TERM $PID

# Wait up to 30 seconds for process to exit
for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
        echo "Process terminated gracefully"
        exit 0
    fi
    sleep 1
done

echo "Process did not respond, forcing termination..."
kill -9 $PID

sleep 1
if ! ps -p $PID > /dev/null 2>&1; then
    echo "Process force killed"
    exit 0
else
    echo "Failed to kill process"
    exit 1
fi

# ===== PRACTICAL EXAMPLES =====

# Restart service properly
SERVICE_PID=$(pgrep apache2)
kill -HUP $SERVICE_PID
# Sends reload signal instead of restarting

# Kill all user's processes (logout user)
sudo pkill -9 -u username
# Forces user logout

# Kill hung process
ps aux | grep hung_process
kill -9 PID
# Last resort for stuck processes

# Kill process tree (parent and all children)
pkill -TERM -P PARENT_PID
# Kills all children
kill -TERM PARENT_PID
# Then kills parent
```

---

#### Exercise 4.3: Process Management Practice

**Objective:** Master viewing, controlling, and managing processes.

1. **Process Viewing:**
   - List all processes on your system
   - Find your current shell's PID
   - Find how long your system has been running
   - Identify the 5 processes using most memory

2. **Background Jobs:**
   - Start a sleep process in background: `sleep 120 &`
   - List your background jobs
   - Bring the job to foreground
   - Suspend it with Ctrl+Z
   - Resume it in background with `bg`

3. **Process Control:**
   - Start another sleep process: `sleep 300 &`
   - Find its PID
   - Check its status with `ps`
   - Kill it gracefully with `kill`

4. **Priority:**
   - Start a process with low priority
   - Check its nice value
   - Change the nice value while it's running

5. **Process Tree:**
   - View the process tree with `pstree`
   - Find your shell and its children
   - Identify init/systemd process (PID 1)

**Expected Results:**
- Comfort using ps, top, jobs commands
- Understanding of process states
- Ability to control background jobs
- Experience with kill signals

**Success Check:**
```bash
# Verify job control
jobs | grep sleep && echo "Background job running"

# Check process
pgrep sleep && echo "Sleep process found"

# View your processes
ps u | grep $USER
```

---

#### Challenge 4.3: Process Monitor Script

**Objective:** Create a comprehensive process monitoring tool.

Build a script that monitors processes:

**Requirements:**

1. **Script Features:**
   - Runs in background (daemon mode)
   - Logs to file every 5 seconds
   - Monitors:
     - Top 5 CPU-consuming processes
     - Top 5 memory-consuming processes
     - Total process count
     - Processes in zombie state
     - Load average

2. **Controls:**
   - Start/stop/status commands
   - Creates PID file
   - Proper signal handling
   - Graceful shutdown

3. **Output Format:**
   - Timestamp for each entry
   - CSV or structured format
   - Rotating log files

**Sample Usage:**
```bash
./process_monitor.sh start    # Start monitoring
./process_monitor.sh status   # Check if running
./process_monitor.sh stop     # Stop monitoring
```

**Sample Log Output:**
```
2024-01-15 14:30:00,CPU:firefox:45%,chrome:23%,Total_Processes:247,Load:1.23
2024-01-15 14:30:05,CPU:firefox:42%,chrome:25%,Total_Processes:248,Load:1.25
```

**Bonus Challenges:**
- Alert if process count exceeds threshold
- Email if zombie processes detected
- Graph CPU/memory usage over time
- Detect and log process crashes
- Integration with monitoring systems

---

### Day 23: System Monitoring

System monitoring helps you understand resource usage, identify bottlenecks, and prevent problems before they impact users.

#### CPU and Memory Monitoring

```bash
# ===== TOP - Interactive Monitor =====

# Basic top
top
# Real-time system statistics
# Updates every 3 seconds by default

# top display sections:
# 1. Summary (uptime, users, load average)
# 2. Tasks (total, running, sleeping, stopped, zombie)
# 3. CPU usage (by percentage)
# 4. Memory usage (physical and swap)
# 5. Process list

# top keyboard commands:
# k: kill process
# r: renice process
# M: sort by memory
# P: sort by CPU
# 1: toggle individual CPU display
# u: filter by user
# c: show full command
# i: toggle idle processes
# d: change update delay
# W: save configuration
# h: help
# q: quit

# top output explained:
# %CPU: CPU usage percentage
# %MEM: Memory usage percentage
# TIME+: Cumulative CPU time
# RES: Resident memory (physical RAM)
# VIRT: Virtual memory size
# SHR: Shared memory

# ===== HTOP - Better Top =====

# Enhanced process viewer
htop
# Install: sudo apt install htop

# htop advantages:
# - Color-coded
# - Mouse support
# - Tree view
# - Easy process management
# - Better visualization
# - More user-friendly

# htop keyboard shortcuts:
# F1: Help
# F2: Setup
# F3: Search
# F4: Filter
# F5: Tree view
# F6: Sort by
# F9: Kill
# F10: Quit
# Space: Tag process
# U: Show user processes
# /: Search

# ===== UPTIME AND LOAD AVERAGE =====

# System uptime and load
uptime
# Output: 14:30:00 up 7 days, 3:42, 2 users, load average: 0.15, 0.20, 0.18
#         ^time    ^uptime    ^users      ^load averages (1m, 5m, 15m)

# Understanding load average:
# - Number of processes waiting for CPU
# - On single-core: 1.0 = fully loaded
# - On dual-core: 2.0 = fully loaded
# - On quad-core: 4.0 = fully loaded

# Check CPU core count
nproc
# Shows number of processing units

# High load interpretation:
# Load > CPU count: System is overloaded
# Load < CPU count: System has capacity
# Load = CPU count: Optimal utilization

# ===== VMSTAT - Virtual Memory Statistics =====

# Virtual memory statistics
vmstat
# One-time snapshot

# Continuous monitoring
vmstat 2
# Updates every 2 seconds

# Numbered intervals
vmstat 2 5
# 2 second intervals, 5 iterations

# vmstat columns:
# Procs:
#   r: processes waiting for runtime
#   b: processes in uninterruptible sleep

# Memory (KB):
#   swpd: virtual memory used
#   free: idle memory
#   buff: buffer memory
#   cache: cache memory

# Swap:
#   si: swap in (from disk)
#   so: swap out (to disk)

# IO:
#   bi: blocks received from block device
#   bo: blocks sent to block device

# System:
#   in: interrupts per second
#   cs: context switches per second

# CPU (percentage):
#   us: user time
#   sy: system time
#   id: idle time
#   wa: wait time (I/O)
#   st: stolen time (virtual machines)

# High swap (si/so): Memory pressure
# High wa: I/O bottleneck

# ===== MPSTAT - Multiprocessor Statistics =====

# CPU usage per processor
mpstat
# Install: sudo apt install sysstat

# Monitor continuously
mpstat 2
# 2 second intervals

# Show all CPUs
mpstat -P ALL
# Individual CPU statistics

# mpstat columns:
# %usr: user-level applications
# %nice: niced processes
# %sys: system/kernel
# %iowait: waiting for I/O
# %irq: hardware interrupts
# %soft: software interrupts
# %idle: idle time

# ===== FREE - Memory Usage =====

# Memory statistics
free
# Basic output in KB

# Human-readable format
free -h
# Shows GB, MB, KB

# Output explained:
#               total   used    free  shared  buff/cache  available
# Mem:          7.7G    2.1G    3.2G    156M        2.4G        5.1G
# Swap:         2.0G      0B    2.0G

# Columns:
# total: Total installed RAM
# used: Used by processes
# free: Completely unused
# shared: Shared memory (tmpfs)
# buff/cache: Kernel buffers/cache
# available: Available for new apps

# Important: "available" is more relevant than "free"
# Linux uses free memory for caching
# Cache is released when needed

# Continuous monitoring
watch -n 1 free -h
# Updates every second

# Check if swapping
free -h | grep Swap
# Swap usage indicates memory pressure

# ===== CHECKING INDIVIDUAL PROCESS MEMORY =====

# Process memory map
pmap PID
# Shows memory segments for process

# Summary only
pmap -x PID
# Extended information

# Process memory in human format
ps -o pid,vsz,rss,cmd -p PID
# VSZ: virtual memory
# RSS: resident (physical) memory
```

#### Disk I/O Monitoring

```bash
# ===== IOSTAT - I/O Statistics =====

# I/O statistics
iostat
# Install: sudo apt install sysstat

# Continuous monitoring
iostat 2
# 2 second intervals

# Extended statistics
iostat -x
# More detailed information

# Specific device
iostat -x sda
# Monitor specific disk

# iostat columns:
# tps: transfers per second
# kB_read/s: KB read per second
# kB_wrtn/s: KB written per second
# kB_read: total KB read
# kB_wrtn: total KB written

# Extended columns (-x):
# rrqm/s: read requests merged
# wrqm/s: write requests merged
# await: average wait time (ms)
# %util: device utilization

# High %util: Disk is bottleneck
# High await: Slow disk/overload

# ===== IOTOP - I/O by Process =====

# Process I/O usage (requires sudo)
sudo iotop
# Install: sudo apt install iotop

# Real-time I/O monitoring
# Shows which processes are doing I/O
# Columns:
#   TID: thread ID
#   DISK READ: read speed
#   DISK WRITE: write speed
#   COMMAND: process name

# iotop options:
# -o: only show processes doing I/O
# -b: batch mode (for logging)
# -n NUM: number of iterations
# -d SEC: delay between iterations

# Example: Log I/O for 60 seconds
sudo iotop -b -n 30 -d 2 > io_log.txt

# ===== DF - Disk Free =====

# Disk space usage
df -h
# -h: human-readable (GB, MB, KB)

# Inode usage
df -i
# Shows inode statistics
# Can run out of inodes before disk space!

# Specific filesystem type
df -t ext4
# Only ext4 filesystems

# Exclude type
df -x tmpfs
# Exclude tmpfs

# ===== DU - Disk Usage =====

# Directory size
du -sh /path
# -s: summary
# -h: human-readable

# Subdirectory sizes
du -h /path
# Shows all subdirectories

# Top-level directories only
du -h --max-depth=1 /path
# Limits depth

# Sort by size
du -h /path | sort -rh
# -r: reverse (largest first)
# -h: human-numeric sort

# Find largest directories
du -h /path | sort -rh | head -20
# Top 20 largest directories

# Exclude patterns
du -h --exclude="*.log" /path
# Skips log files

# ===== LSOF - List Open Files =====

# Files opened by process
lsof -p PID
# Shows all files, sockets, etc.

# Processes using file
lsof /path/to/file
# Shows which processes have file open

# Processes using directory
lsof +D /path
# Recursively checks directory

# Network connections
lsof -i
# All network connections

# Specific port
lsof -i :80
# What's using port 80

# User's open files
lsof -u username
# All files opened by user

# ===== FINDING SPACE HOGS =====

# Largest files in directory
find /path -type f -exec du -h {} + | sort -rh | head -20

# Files larger than size
find /path -type f -size +100M
# Files over 100 MB

# Files by size range
find /path -type f -size +100M -size -1G
# Between 100 MB and 1 GB

# Old large files
find /path -type f -size +100M -mtime +90
# Large files not modified in 90 days
# Candidates for cleanup

# Disk usage by extension
find /path -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
# Counts files by extension
```

#### Network Monitoring

```bash
# ===== NETSTAT - Network Statistics =====

# Active network connections
netstat -tuln
# -t: TCP connections
# -u: UDP connections
# -l: listening sockets
# -n: numeric (no DNS resolution)

# All connections with process info
sudo netstat -tulnp
# -p: show program/PID
# Requires sudo

# Routing table
netstat -r
# Shows kernel routing table

# Interface statistics
netstat -i
# Network interface stats

# ===== SS - Socket Statistics =====

# Modern replacement for netstat
ss -tuln
# Same options as netstat
# Faster performance

# Established connections
ss -t
# TCP connections only

# With process information
sudo ss -tulnp
# Shows which process owns socket

# Statistics
ss -s
# Summary statistics

# Filter by state
ss -t state established
# Only established connections

# ===== IFTOP - Interface Top =====

# Bandwidth usage by connection
sudo iftop
# Install: sudo apt install iftop

# Specific interface
sudo iftop -i eth0
# Monitor eth0 only

# No DNS resolution
sudo iftop -n
# Faster, shows IPs only

# ===== NLOAD - Network Load =====

# Network bandwidth monitor
nload
# Install: sudo apt install nload

# Specific interface
nload eth0

# All interfaces
nload -m

# ===== NETHOGS - Network Hogs =====

# Bandwidth usage by process
sudo nethogs
# Install: sudo apt install nethogs

# Specific interface
sudo nethogs eth0

# Shows which processes using most bandwidth
# Useful for finding bandwidth hogs

# ===== TCPDUMP - Packet Capture =====

# Capture packets
sudo tcpdump
# Shows all packets on default interface

# Specific interface
sudo tcpdump -i eth0

# Save to file
sudo tcpdump -w capture.pcap
# Can analyze with Wireshark

# Read from file
tcpdump -r capture.pcap

# Filter by host
sudo tcpdump host 192.168.1.100

# Filter by port
sudo tcpdump port 80

# TCP packets only
sudo tcpdump tcp

# ===== PRACTICAL NETWORK MONITORING =====

# Find what's using bandwidth
sudo nethogs

# Check for listening ports
sudo ss -tulnp | grep LISTEN

# Monitor specific port
sudo tcpdump -i any port 22

# Check established connections
ss -t state established

# Count connections by IP
sudo netstat -tn | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn
```

#### System Logs

```bash
# ===== DMESG - Kernel Messages =====

# View kernel ring buffer
dmesg
# Boot messages and kernel events

# Human-readable timestamps
dmesg -T
# -T: human-readable time

# Follow new messages
dmesg -w
# -w: wait for new messages

# Filter by facility
dmesg --facility=kern
# kernel messages only

# Filter by level
dmesg --level=err
# Error messages only

# Clear ring buffer (requires root)
sudo dmesg -C

# ===== JOURNALCTL - Systemd Journal =====

# View all logs
journalctl
# Systemd journal viewer
# Use arrow keys, space, 'q' to quit

# Follow logs (like tail -f)
journalctl -f
# Shows new entries as they arrive

# Since specific time
journalctl --since "2024-01-15 14:00:00"
# Specific timestamp

# Since relative time
journalctl --since "1 hour ago"
journalctl --since "yesterday"
journalctl --since "today"

# Time range
journalctl --since "2024-01-15" --until "2024-01-16"

# Specific unit/service
journalctl -u apache2
# Service-specific logs

# Follow service
journalctl -u apache2 -f
# Real-time service logs

# Boot messages
journalctl -b
# Current boot only

# Previous boots
journalctl --list-boots
journalctl -b -1
# Previous boot logs

# By priority
journalctl -p err
# Error level and above

# Priority levels:
# 0: emerg
# 1: alert
# 2: crit
# 3: err
# 4: warning
# 5: notice
# 6: info
# 7: debug

# By user
journalctl _UID=1000
# Specific user's events

# Kernel messages only
journalctl -k
# Like dmesg

# Output format
journalctl -o json-pretty
# JSON format

# Disk usage
journalctl --disk-usage
# Journal size on disk

# Vacuum old entries
sudo journalctl --vacuum-time=7d
# Keep only 7 days

sudo journalctl --vacuum-size=500M
# Limit to 500 MB

# ===== TRADITIONAL LOG FILES =====

# System log (Ubuntu/Debian)
tail -f /var/log/syslog
# Follow system log

# Authentication log
sudo tail -f /var/log/auth.log
# Login attempts, sudo usage

# Kernel log
sudo tail -f /var/log/kern.log

# Application logs
ls /var/log/
# Various application logs

# Apache logs
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# ===== LOG ANALYSIS =====

# Count errors in log
grep -c "ERROR" /var/log/syslog

# Extract error lines
grep "ERROR" /var/log/syslog

# Errors in last hour
grep "ERROR" /var/log/syslog | grep "$(date '+%b %d %H')"

# Most common errors
grep "ERROR" /var/log/syslog | sort | uniq -c | sort -rn | head -10

# Failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Successful logins
sudo grep "Accepted password" /var/log/auth.log

# Sudo usage
sudo grep "sudo" /var/log/auth.log

# ===== SAR - System Activity Report =====

# Historical system statistics
sar
# Install: sudo apt install sysstat

# CPU usage
sar -u 2 5
# 2 second intervals, 5 iterations

# Memory usage
sar -r

# Swap usage
sar -S

# I/O statistics
sar -b

# Network statistics
sar -n DEV

# Today's statistics
sar -q
# Load average

# Specific date
sar -r -f /var/log/sysstat/sa15
# 15th day of month

# ===== ENABLING SAR =====

# Enable data collection
sudo systemctl enable sysstat
sudo systemctl start sysstat

# Configure collection interval
sudo nano /etc/cron.d/sysstat
# Default: every 10 minutes
```

---

#### Exercise 4.4: System Monitoring Practice

**Objective:** Master system resource monitoring and log analysis.

1. **CPU and Memory:**
   - Check your system's load average
   - Open `top` and identify top 3 CPU consumers
   - Open `htop` and find top 3 memory consumers
   - Check if your system is using swap

2. **Disk Monitoring:**
   - Check disk usage with `df -h`
   - Find the 10 largest directories in your home
   - Check I/O statistics with `iostat`
   - Identify if any disk is over 80% full

3. **Process Analysis:**
   - Find the oldest running process on your system
   - Count total number of processes
   - Identify any zombie processes
   - Check your shell's PID and parent PID

4. **Log Analysis:**
   - View the last 50 lines of system log
   - Search for recent error messages
   - Check failed login attempts
   - View logs from last boot

5. **Network:**
   - List all listening ports
   - Find established network connections
   - Identify which processes are using network

**Expected Results:**
- Comfort with monitoring tools
- Ability to identify resource issues
- Understanding of system logs
- Skills to troubleshoot performance

**Success Check:**
```bash
# System health summary
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $5}')"
```

---

#### Challenge 4.4: System Health Monitor

**Objective:** Create a comprehensive system health monitoring solution.

Build a monitoring script that collects and logs system metrics:

**Requirements:**

1. **Data Collection (every 10 seconds):**
   - Timestamp
   - CPU load average (1, 5, 15 minutes)
   - Memory usage (used, available, percentage)
   - Swap usage
   - Disk usage (percentage for /)
   - Top 3 processes by CPU
   - Top 3 processes by memory
   - Network connections count

2. **Output Format:**
   - CSV file for easy analysis
   - Rotating logs (max 100MB per file)
   - Separate log files by date

3. **Analysis Features:**
   - Generate hourly summary
   - Alert if CPU load > threshold
   - Alert if memory > 90%
   - Alert if disk > 85%
   - Detect sudden process spikes

4. **Visualization:**
   - Create simple text-based graphs
   - Daily summary report
   - Peak usage times

**Sample Output:**
```csv
timestamp,load_1m,load_5m,load_15m,mem_used_pct,swap_used_pct,disk_used_pct
2024-01-15T14:30:00,1.25,1.18,1.05,67.3,0.0,42.1
2024-01-15T14:30:10,1.28,1.19,1.06,67.5,0.0,42.1
```

**Bonus Challenges:**
- Email alerts for critical conditions
- Web dashboard for real-time monitoring
- Integration with Grafana/Prometheus
- Predictive analysis (resource trend prediction)
- Anomaly detection
- Comparison with historical averages

---

## Module Summary

Congratulations! You've completed Module 4 and mastered user and process management!

### Key Skills Acquired

✅ **User Management**
- Creating, modifying, and deleting user accounts
- Password management and aging policies
- Understanding /etc/passwd and /etc/shadow
- Switching between users (su, sudo)

✅ **Group Management**
- Creating and managing groups
- Adding/removing users from groups
- Primary vs secondary groups
- Group-based access control

✅ **Sudo Configuration**
- Understanding sudo privileges
- Editing sudoers file safely with visudo
- Granting specific command access
- Implementing role-based access

✅ **Process Management**
- Viewing processes (ps, top, htop)
- Background and foreground jobs
- Process priorities (nice, renice)
- Killing processes (signals)
- Understanding process states

✅ **System Monitoring**
- CPU and memory monitoring
- Disk I/O analysis
- Network monitoring
- Log file analysis
- Performance troubleshooting

### Essential Commands Learned

**User Management:**
- `useradd`, `usermod`, `userdel`, `passwd`, `chage`, `id`, `who`, `last`

**Group Management:**
- `groupadd`, `groupmod`, `groupdel`, `gpasswd`, `groups`, `newgrp`

**Sudo:**
- `sudo`, `visudo`, `sudo -l`, `sudo -i`, `sudo -u`

**Process Management:**
- `ps`, `top`, `htop`, `pgrep`, `pidof`, `kill`, `killall`, `pkill`, `nice`, `renice`, `jobs`, `fg`, `bg`

**Monitoring:**
- `top`, `htop`, `uptime`, `free`, `vmstat`, `iostat`, `iotop`, `df`, `du`, `netstat`, `ss`, `lsof`, `dmesg`, `journalctl`, `sar`

### Best Practices Learned

1. Always use `visudo` to edit sudoers
2. Implement principle of least privilege
3. Monitor sudo logs regularly
4. Use `kill -TERM` before `kill -9`
5. Set appropriate nice values for background tasks
6. Monitor system resources proactively
7. Rotate and archive log files
8. Document user account purposes
9. Regular security audits of user accounts
10. Keep system logs for forensics

### Security Takeaways

- User management is critical for system security
- Sudo provides better audit trail than su
- Monitor failed login attempts
- Remove inactive user accounts
- Use strong password policies
- Limit root access
- Review sudo logs regularly
- Watch for zombie processes (may indicate issues)
- Monitor resource usage to prevent DoS

### What's Next?

In **Module 5: Networking Essentials**, you'll learn:
- Network configuration and interfaces
- IP addressing and routing
- DNS and DHCP
- Network troubleshooting tools
- Firewalls and security
- SSH and remote access
- Network services

---

## Final Notes

User and process management are daily tasks for system administrators. The skills you've learned here form the foundation for:
- Security management
- Performance tuning
- Troubleshooting
- Automation
- Multi-user environments

**Remember:**
- With great power comes great responsibility
- Always verify before deleting users or killing processes
- Monitor your systems regularly
- Document changes
- Test sudo configurations carefully
- Keep logs for troubleshooting

---

*End of Module 4*

**When you're ready to continue, please review this module and provide your feedback. Then say "continue" to proceed to Module 5: Networking Essentials.**