# Module 1: Linux Fundamentals

## Overview

Welcome to your Linux journey! This module establishes the foundation for everything you'll learn moving forward. You'll become comfortable with the terminal, understand how to navigate the file system, and learn essential commands that you'll use daily as a Linux user or administrator.

By the end of this module, you'll be able to confidently navigate directories, create and manipulate files, use text editors, and leverage powerful command-line features to work efficiently. These skills are critical—every advanced Linux topic builds on these fundamentals.

**What You'll Learn:**
- Terminal basics and navigation
- File and directory operations
- Viewing and editing files with multiple tools
- Using wildcards and patterns for efficiency
- System information commands
- Command-line shortcuts and productivity techniques
- Input/output redirection and pipelines
- Managing command history

---

## Table of Contents

### Week 1: Getting Started
- [Day 1: Terminal Basics](#day-1-terminal-basics)
- [Day 2: File Operations](#day-2-file-operations)
- [Day 3: Viewing and Editing Files](#day-3-viewing-and-editing-files)
- [Day 4: Wildcards and Patterns](#day-4-wildcards-and-patterns)

### Week 2: System Information & Command Line Mastery
- [Day 5: System Information Commands](#day-5-system-information-commands)
- [Day 6: Command Line Efficiency](#day-6-command-line-efficiency)
- [Day 7: Input/Output Redirection](#day-7-inputoutput-redirection)

---

## Week 1: Getting Started

### Day 1: Terminal Basics

The terminal (also called the command line or shell) is your gateway to Linux power. Unlike graphical interfaces, the terminal gives you direct, precise control over your system. Learning to navigate and use the terminal effectively is the most important skill you'll develop.

#### Opening the Terminal

```bash
# On Ubuntu Desktop: Press Ctrl+Alt+T
# This opens a new terminal window

# For remote systems (like your Raspberry Pi):
# Connect via SSH (Secure Shell)
ssh username@raspberry_pi_ip
# Example: ssh pi@192.168.1.100
# You'll be prompted for the password
```

**Common mistake:** Make sure you replace `username` with your actual username and `raspberry_pi_ip` with the actual IP address of your Pi (e.g., 192.168.1.100).

#### Understanding Your Location

Every command you run happens in a specific directory. Think of the terminal as a window into one folder at a time.

```bash
# Print Working Directory - shows your current location
pwd
# Output example: /home/username
# This tells you exactly where you are in the file system

# The tilde (~) is a shortcut for your home directory
# So /home/username is the same as ~
```

#### Listing Files and Directories

```bash
# List files in the current directory
ls
# Shows files and folders in basic format

# Long format - shows detailed information
ls -l
# Displays: permissions, owner, size, modification date, and name
# Example output:
# drwxr-xr-x 2 user user 4096 Jan 15 10:30 Documents
# -rw-r--r-- 1 user user 1234 Jan 15 09:15 file.txt

# Include hidden files (files starting with a dot)
ls -la
# Hidden files like .bashrc, .profile won't show without -a
# The 'a' stands for "all"

# Human-readable file sizes (KB, MB, GB instead of bytes)
ls -lh
# Makes it easier to understand file sizes at a glance
# Example: 1.5M instead of 1572864

# Combine multiple options
ls -lah
# Long format + all files + human-readable sizes
# This is one of the most commonly used combinations
```

**Tip:** You can combine options in any order: `ls -lah` is the same as `ls -alh` or `ls -hla`.

#### Navigating Directories

```bash
# Change to a specific directory (absolute path)
cd /home
# The forward slash (/) at the beginning means "start from root"
# This works no matter where you currently are

# Go to your home directory
cd ~
# OR simply:
cd
# Both commands take you home

# Go up one directory level (to the parent directory)
cd ..
# The two dots (..) represent the parent directory
# If you're in /home/user/Documents, this takes you to /home/user

# Go to the previous directory (toggle back and forth)
cd -
# Useful when working between two directories
# It's like the "back" button in a web browser

# Go to the root directory (top of the file system)
cd /
# Everything in Linux starts from here

# Navigate to a subdirectory of your current location (relative path)
cd Documents
# No leading slash means "relative to where I am now"
# Only works if Documents exists in your current directory

# Navigate multiple levels at once
cd Documents/Projects/Website
# You can chain directories with forward slashes
```

**Understanding Paths:**
- **Absolute path:** Starts with `/` and works from anywhere (e.g., `/home/user/Documents`)
- **Relative path:** No leading `/`, relative to current location (e.g., `Documents/file.txt`)

#### Getting Help

Linux has excellent built-in documentation. Learning to read manual pages is crucial.

```bash
# Read the full manual page for a command
man ls
# Opens detailed documentation in a pager
# Press 'q' to quit, use arrow keys or Page Up/Down to scroll
# Press '/' to search within the manual

# Quick help - brief usage information
ls --help
# Faster than man pages, shows common options
# Good for a quick reminder of syntax

# Brief one-line description of a command
whatis ls
# Output: "ls - list directory contents"
# Useful when you know the command but forget what it does

# Find commands related to a topic
apropos list
# Searches command descriptions for the word "list"
# Great when you know what you want to do but not the command name
```

**Pro tip:** When reading man pages, type `/search_term` to find specific information, then press `n` to jump to the next occurrence.

---

#### Exercise 1.1: Navigation Practice

**Objective:** Build muscle memory for navigation commands.

1. Open your terminal
2. Navigate to `/var/log` and confirm with `pwd`
3. Navigate to `/etc` and confirm with `pwd`
4. Navigate to `/usr/bin` and list the files there
5. Return to your home directory using `cd ~`
6. Navigate to the root directory `/`
7. Use `cd -` to return to your previous location

**Expected Results:**
- You should see different directory paths with each `pwd`
- `/usr/bin` should show many executable files
- Each `cd` command should change your location immediately

**Success Check:**
```bash
# Run this to verify you're in your home directory
pwd | grep -q $HOME && echo "Success! You're home." || echo "Try again"
```

---

#### Challenge 1.1: Remote Directory Exploration

**Objective:** Learn to work with paths without changing directories.

Without using `cd`, complete these tasks:

1. List the contents of `/etc` while staying in your home directory
2. List the contents of `/var/log` in long format with human-readable sizes
3. Check if the file `/etc/passwd` exists

**Hints:**
- Remember: most commands accept paths as arguments
- You can provide any valid path to `ls`
- The format is: `command [options] /path/to/directory`

**Solution approach:**
```bash
# Example of listing a remote directory
ls /etc
# You stayed home but saw /etc's contents
```

---

### Day 2: File Operations

Creating, copying, moving, and deleting files are fundamental operations you'll perform constantly. Understanding these commands and their options is essential for safe and efficient file management.

#### Creating Files and Directories

```bash
# Create an empty file
touch file.txt
# If file.txt doesn't exist, it's created
# If it exists, only the modification timestamp is updated
# Useful for creating placeholder files quickly

# Create a directory (folder)
mkdir mydir
# Creates a single directory in the current location
# Fails if the directory already exists

# Create nested directories (multiple levels at once)
mkdir -p dir1/dir2/dir3
# The -p flag means "create parent directories as needed"
# Without -p, this would fail if dir1 doesn't exist
# Also doesn't error if directories already exist (safe to rerun)

# Create multiple directories at once
mkdir docs images scripts
# Space-separated list creates multiple directories
```

**Common mistake:** Forgetting the `-p` flag when creating nested directories will cause an error if parent directories don't exist.

#### Copying Files and Directories

```bash
# Copy a file
cp file.txt file_backup.txt
# Creates a duplicate with a new name
# Original file is unchanged

# Copy file to another directory
cp file.txt /tmp/
# The trailing slash (/) clarifies that /tmp is a directory
# The filename stays the same in the destination

# Copy and rename in one command
cp file.txt /tmp/newname.txt
# File is copied to /tmp with a different name

# Copy a directory and all its contents (recursive)
cp -r mydir mydir_backup
# The -r flag means "recursive" - copies everything inside
# Without -r, copying directories fails
# CRITICAL: Always use -r for directories

# Interactive copy (ask before overwriting)
cp -i file.txt existing.txt
# Prompts: "overwrite existing.txt? (y/n)"
# Prevents accidental data loss
# Good practice when you're unsure

# Preserve file attributes (permissions, timestamps)
cp -p file.txt backup.txt
# Maintains original file's properties
# Useful for backups where metadata matters

# Verbose mode (show what's being copied)
cp -v file.txt /tmp/
# Output: 'file.txt' -> '/tmp/file.txt'
# Helpful for confirming operations
```

**Best Practice:** Use `cp -i` (interactive) when overwriting is possible, and `cp -r` for any directory operations.

#### Moving and Renaming Files

The `mv` command serves two purposes: moving files to new locations and renaming them. There's no separate "rename" command in Linux.

```bash
# Rename a file (same location, different name)
mv file.txt newname.txt
# The original file.txt no longer exists
# This is a true move, not a copy

# Move file to another directory
mv file.txt /tmp/
# File disappears from current directory
# Now exists in /tmp/ with the same name

# Move and rename simultaneously
mv file.txt /tmp/newname.txt
# File moves AND gets a new name

# Move directory and all contents
mv mydir /tmp/
# Directories don't need -r flag with mv
# Everything inside moves automatically

# Interactive move (ask before overwriting)
mv -i file.txt /tmp/existing.txt
# Safety check before overwriting files
# Recommended when moving to locations with existing files

# Move multiple files to a directory
mv file1.txt file2.txt file3.txt /destination/
# Last argument must be a directory
# All files move to that directory
```

**Important:** Unlike `cp`, `mv` removes the original file. There's no "undo" command, so be careful!

#### Deleting Files and Directories

**⚠️ WARNING:** Deleted files don't go to a "Trash" or "Recycle Bin." Deletion is permanent. Always double-check before running `rm` commands.

```bash
# Delete a single file
rm file.txt
# File is permanently removed
# No confirmation prompt by default

# Interactive delete (safer - asks for confirmation)
rm -i file.txt
# Prompts: "remove file.txt? (y/n)"
# RECOMMENDED for beginners and important files
# Prevents accidental deletions

# Delete a directory and all its contents (recursive)
rm -r mydir
# Removes directory and everything inside
# Subdirectories, files, everything
# Use with extreme caution

# Force delete without prompts (DANGEROUS!)
rm -rf mydir
# -r: recursive (directories)
# -f: force (no confirmations, ignore errors)
# ⚠️ THIS IS THE MOST DANGEROUS COMMAND
# Never run "rm -rf /" or "rm -rf /*" - it deletes EVERYTHING

# Delete empty directories only (safe)
rmdir emptydir
# Only works if directory is completely empty
# Fails if directory contains any files or subdirectories
# Safer alternative when you're sure directory should be empty

# Delete multiple files at once
rm file1.txt file2.txt file3.txt
# Space-separated list
```

**Pro Safety Tips:**
1. Always use `rm -i` for interactive deletion when learning
2. Use `ls` to verify what you're about to delete before running `rm`
3. Never use `rm -rf` unless you're absolutely certain
4. Consider creating an alias: `alias rm='rm -i'` in your `.bashrc` file

#### Viewing File Contents

```bash
# Display entire file contents (small files)
cat file.txt
# CAT stands for "concatenate"
# Dumps entire file to screen immediately
# Good for short files, overwhelming for long ones

# Page through file contents (better for long files)
less file.txt
# Opens file in a pager
# Controls: arrow keys to scroll, 'q' to quit, '/' to search
# Space bar for next page, 'b' for previous page
# Press 'h' for help while inside less

# Show first 10 lines of a file
head file.txt
# Useful for previewing file contents
# Good for checking CSV headers or log file starts

# Show first 20 lines (custom number)
head -n 20 file.txt
# -n specifies number of lines
# Can use any number you want

# Show last 10 lines of a file
tail file.txt
# Perfect for checking the end of log files
# See the most recent entries

# Show last 20 lines (custom number)
tail -n 20 file.txt

# Follow file in real-time (live updates)
tail -f /var/log/syslog
# The -f flag means "follow"
# Shows new lines as they're added to the file
# Essential for monitoring active log files
# Press Ctrl+C to stop following

# More advanced: show last 50 lines and follow
tail -n 50 -f /var/log/syslog
# Combines both options: start with 50 lines, then follow new ones
```

**Use Case Examples:**
- `cat`: Quick look at configuration files
- `less`: Read documentation or long files
- `head`: Check structure of data files
- `tail -f`: Monitor log files for errors in real-time

---

#### Exercise 1.2: File Management Practice

**Objective:** Master basic file operations safely.

Complete these tasks in order:

1. Create a directory called `linux_practice` in your home directory
2. Navigate into `linux_practice`
3. Create 5 text files named `day1.txt` through `day5.txt` (Hint: use touch)
4. Copy the entire directory to `linux_practice_backup` (remember the -r flag!)
5. Navigate into `linux_practice_backup`
6. Rename `day1.txt` to `first_day.txt`
7. Return to the original `linux_practice` directory
8. Delete `day5.txt` using interactive mode (-i flag)
9. List the contents of both directories to verify your changes

**Expected Results:**
- `linux_practice` should contain: day1.txt, day2.txt, day3.txt, day4.txt
- `linux_practice_backup` should contain: first_day.txt, day2.txt, day3.txt, day4.txt, day5.txt

**Success Check:**
```bash
# Verify the original directory (should show 4 files)
ls ~/linux_practice | wc -l

# Verify the backup directory (should show 5 files)
ls ~/linux_practice_backup | wc -l
```

---

#### Challenge 1.2: Advanced Directory Creation

**Objective:** Learn efficiency with nested structures and multiple operations.

Complete this challenge:

1. Create a nested directory structure `projects/web/frontend/css` in a single command
2. Create another branch: `projects/web/backend/api` in a single command
3. Navigate to the `css` directory
4. Create a file called `style.css`
5. Navigate to the `api` directory using a relative path
6. Create files called `server.js` and `routes.js`
7. Return to your home directory
8. List the entire `projects` tree structure (Hint: use `ls -R` or install and use `tree`)

**Hints:**
- Remember the `-p` flag for mkdir
- Relative paths use `..` to go up and directory names to go down
- From `frontend/css`, getting to `backend/api` means: up twice, then down to backend/api

**Advanced Option:** If you have the `tree` command installed (`sudo apt install tree`), run `tree projects` to see a visual representation of your directory structure.

---

### Day 3: Viewing and Editing Files

Being able to view and edit files is essential for configuration, scripting, and system administration. Linux offers multiple tools, from simple viewers to powerful editors. Understanding when to use each tool makes you more efficient.

#### Viewing Files - Multiple Methods

```bash
# Display entire file at once
cat filename
# Fast and simple
# Output goes directly to terminal
# Good for: small files, piping to other commands

# Display file in reverse order (bottom to top)
tac filename
# TAC is CAT backwards
# Useful for log files (most recent entries at top)
# Example: tac /var/log/syslog

# Page through file (old-school pager)
more filename
# Older pager program, less features than 'less'
# Space bar to advance, 'q' to quit
# Generally replaced by 'less' in modern systems

# Page through file (modern pager - better than more)
less filename
# Most versatile file viewer
# Navigation:
#   - Arrow keys or j/k: line by line
#   - Space bar: next page
#   - b: previous page
#   - /pattern: search forward
#   - ?pattern: search backward
#   - n: next search result
#   - N: previous search result
#   - g: go to beginning
#   - G: go to end
#   - q: quit

# Display line numbers with cat
cat -n filename
# Adds line numbers to output
# Helpful for referencing specific lines
# Example: "The error is on line 47"

# Show tabs and end-of-line characters
cat -A filename
# Makes invisible characters visible
# Tabs show as ^I, line ends as $
# Useful for debugging formatting issues
```

**Pro Tip:** Remember the saying: "less is more, more is less" - the `less` command is actually more powerful than `more`!

#### Editing Files with Nano (Beginner-Friendly)

Nano is a straightforward text editor perfect for beginners. It displays available commands at the bottom of the screen.

```bash
# Open file in nano (creates file if it doesn't exist)
nano filename
# User-friendly interface with visible commands
# All commands shown at bottom (^ means Ctrl key)

# Nano keyboard shortcuts (^ means Ctrl):
# ^O (Ctrl+O): Save/Write Out
#   - Prompts for filename confirmation
#   - Press Enter to confirm
# ^X (Ctrl+X): Exit nano
#   - If file is modified, asks to save
# ^K (Ctrl+K): Cut/Kill entire line
#   - Deletes line and copies to buffer
# ^U (Ctrl+U): Paste/UnCut
#   - Pastes previously cut line(s)
# ^W (Ctrl+W): Search/Where Is
#   - Type search term and press Enter
# ^\ (Ctrl+\): Search and Replace
#   - Enter search term, then replacement
# ^C (Ctrl+C): Show current cursor position
#   - Displays line and column number
# ^G (Ctrl+G): Display help text
#   - Shows all available commands

# Example workflow:
# 1. nano myfile.txt
# 2. Type your content
# 3. Press Ctrl+O, then Enter to save
# 4. Press Ctrl+X to exit
```

**Best for:** Quick edits, configuration files, beginners, or when you need simplicity.

#### Editing Files with Vim (Powerful but Complex)

Vim is extremely powerful but has a steep learning curve. It uses different "modes" for different tasks. Learning Vim takes time, but it's worth it for efficiency.

```bash
# Open file in vim
vim filename
# Starts in "Normal" mode (not editing)
# This is vim's command mode

# Vim has three main modes:
# 1. Normal mode (default): Navigate and execute commands
# 2. Insert mode: Actually type and edit text
# 3. Command mode: Execute advanced commands

# ===== NORMAL MODE COMMANDS =====
# (These only work when NOT in insert mode)

# Enter insert mode (start typing):
i         # Insert before cursor
a         # Insert after cursor (append)
o         # Open new line below and insert
O         # Open new line above and insert
# Press ESC to exit insert mode and return to normal mode

# Save and quit:
:w        # Write (save) file
:q        # Quit vim
:wq       # Write and quit in one command
:q!       # Quit without saving (force quit)
:x        # Save and quit (alternative to :wq)

# Navigation in normal mode:
h         # Move left
j         # Move down
k         # Move up
l         # Move right
# (or use arrow keys)

0         # Move to beginning of line
$         # Move to end of line
gg        # Go to first line of file
G         # Go to last line of file
:n        # Go to line number n (e.g., :42 goes to line 42)

# Editing in normal mode:
x         # Delete character under cursor
dd        # Delete entire line (also cuts to clipboard)
dw        # Delete word
yy        # Yank (copy) entire line
yw        # Yank word
p         # Paste after cursor
P         # Paste before cursor
u         # Undo last change
Ctrl+r    # Redo (opposite of undo)

# Search:
/pattern  # Search forward for pattern
?pattern  # Search backward for pattern
n         # Jump to next search result
N         # Jump to previous search result

# Visual mode (selecting text):
v         # Start visual mode (character selection)
V         # Start visual line mode (line selection)
# Then use movement keys to select, y to copy, d to delete

# Example editing session:
# 1. vim myfile.txt
# 2. Press 'i' to enter insert mode
# 3. Type your text
# 4. Press ESC to return to normal mode
# 5. Type :wq and press Enter to save and quit
```

**Common Beginner Mistakes:**
- Trying to type while in Normal mode (press `i` first!)
- Forgetting to press ESC before running commands
- Accidentally pressing keys in Normal mode (try `u` to undo)
- Not saving before quitting (use `:wq` not just `:q`)

**Best for:** Experienced users, server administration (vim is almost always available), and power users who want efficiency.

#### Quick File Creation with Echo

```bash
# Create file with content (overwrites if exists)
echo "Hello Linux" > file.txt
# The > operator redirects output to a file
# ⚠️ WARNING: This REPLACES the entire file content
# Any existing content is destroyed

# Append to file (adds to the end)
echo "More text" >> file.txt
# The >> operator appends instead of overwriting
# Safe to use repeatedly - won't destroy existing content

# Create file with multiple lines
echo -e "Line 1\nLine 2\nLine 3" > file.txt
# -e flag enables interpretation of backslash escapes
# \n represents a new line

# Example workflow:
echo "#!/bin/bash" > script.sh
echo "echo 'Hello World'" >> script.sh
# Creates a simple bash script file
```

**Use Case:** Quick file creation, adding lines to files, or creating simple configuration files without opening an editor.

#### Comparing Files

```bash
# Show differences between two files
diff file1.txt file2.txt
# Output shows lines that differ
# < indicates line is in file1
# > indicates line is in file2
# Useful for comparing versions or configurations

# Side-by-side comparison
diff -y file1.txt file2.txt
# Displays files in two columns
# Easier to read for humans
# | symbol shows differences

# Unified diff format (like git)
diff -u file1.txt file2.txt
# Shows context around changes
# + for additions, - for deletions
# This is the format used by patch files

# Compare directories
diff -r dir1/ dir2/
# -r means recursive
# Compares all files in both directories
# Shows which files differ or are missing
```

---

#### Exercise 1.3: Text Editing Practice

**Objective:** Become comfortable with both nano and basic file creation.

1. Create a file called `myinfo.txt` using nano
2. Add the following information:
   - Your name on line 1
   - Your favorite Linux distribution on line 2
   - Today's date on line 3
   - Why you're learning Linux on line 4
3. Save the file and exit nano
4. View the file using `cat`
5. View the file using `less` (practice scrolling and searching)
6. View only the first 2 lines using `head`
7. Append the text "I'm learning Linux!" to the file using echo
8. Verify the new line was added using `tail`

**Expected Results:**
- File should have 5 lines total
- Last line should be "I'm learning Linux!"
- You should be comfortable opening, editing, and saving files

**Success Check:**
```bash
# This should show 5
wc -l myinfo.txt

# This should show "I'm learning Linux!"
tail -n 1 myinfo.txt
```

---

#### Challenge 1.3: Vim Practice Exercise

**Objective:** Get comfortable with vim's basic operations.

**This challenge is optional but recommended for building valuable skills.**

1. Create a file called `vim_practice.txt` using vim
2. Enter insert mode and type at least 20 lines of text (any content - copy a poem, song lyrics, or just practice sentences)
3. Exit insert mode and practice:
   - Navigating with h, j, k, l
   - Jumping to the beginning and end of the file (gg and G)
   - Deleting a line (dd)
   - Copying a line (yy) and pasting it (p)
   - Searching for a specific word (/word)
4. Make at least 3 different edits
5. Save and quit using `:wq`
6. Reopen the file and verify your changes

**Hints:**
- Don't panic if things seem weird - just press ESC to get back to normal mode
- Remember: `i` to insert, ESC to stop inserting, `:wq` to save and quit
- Practice makes perfect with vim - the first few times feel awkward, then it becomes natural

**Why Learn Vim?**
- It's available on virtually every Linux system
- Essential for emergency situations when no GUI is available
- Extremely efficient once you learn it
- Common in professional environments

---

### Day 4: Wildcards and Patterns

Wildcards let you work with multiple files at once using patterns instead of typing each filename. This is one of the most powerful time-saving features in Linux. Master wildcards and you'll work exponentially faster.

#### Understanding Wildcards

```bash
# The asterisk (*) - matches any number of characters (including zero)
ls *.txt
# Lists all files ending in .txt
# Examples: file.txt, document.txt, test123.txt
# Does NOT match: file.txt.bak

ls file*
# Lists all files starting with 'file'
# Examples: file.txt, file1, file_backup, file
# Matches zero or more characters after 'file'

ls *
# Lists EVERYTHING in current directory
# Same as just running 'ls'

ls *.* 
# Lists all files with a dot (usually files with extensions)
# Examples: file.txt, image.jpg, script.sh
# Does NOT match files without extensions like 'README'

# The question mark (?) - matches exactly ONE character
ls file?.txt
# Matches: file1.txt, fileA.txt, file_.txt
# Does NOT match: file12.txt (two characters) or file.txt (zero characters)

ls file???.txt
# Matches exactly 3 characters between file and .txt
# Examples: file123.txt, fileABC.txt
# Does NOT match: file1.txt or file1234.txt

# Square brackets [] - matches ONE character from a set
ls file[123].txt
# Matches: file1.txt, file2.txt, file3.txt
# Does NOT match: file4.txt, fileA.txt

ls file[0-9].txt
# Matches any single digit: file0.txt through file9.txt
# The dash - creates a range

ls file[a-z].txt
# Matches any single lowercase letter
# Examples: filea.txt, fileb.txt, filez.txt

ls file[A-Z].txt
# Matches any single uppercase letter

ls file[0-9][0-9].txt
# Matches two digits: file00.txt through file99.txt
# Examples: file23.txt, file99.txt, file01.txt

# Negation - NOT matching characters
ls file[!123].txt
# Matches any character EXCEPT 1, 2, or 3
# Examples: file4.txt, fileA.txt, file_.txt
# Does NOT match: file1.txt, file2.txt, file3.txt

ls file[!0-9].txt
# Matches any character that's NOT a digit
# Examples: fileA.txt, file_.txt
# Does NOT match: file1.txt, file5.txt
```

**Important:** Wildcards are expanded by the shell BEFORE the command runs. When you type `ls *.txt`, the shell first finds all matching files, then runs `ls file1.txt file2.txt file3.txt`.

#### Brace Expansion - Generating Patterns

Brace expansion generates strings based on patterns you specify. It's incredibly useful for creating multiple files or directories at once.

```bash
# Generate a sequence of numbers
echo file{1..5}.txt
# Output: file1.txt file2.txt file3.txt file4.txt file5.txt
# Note: This GENERATES the text, doesn't check if files exist

# Create multiple files at once
touch file{1..10}.txt
# Creates: file1.txt, file2.txt, ... file10.txt
# Much faster than creating each file individually

# Generate with leading zeros
echo file{001..100}.txt
# Output: file001.txt, file002.txt, ... file100.txt
# Leading zeros are preserved

# Generate letter sequences
echo {a..z}
# Output: a b c d e f g h i j k l m n o p q r s t u v w x y z

touch test{A..D}.txt
# Creates: testA.txt, testB.txt, testC.txt, testD.txt

# Generate with step values (requires bash 4+)
echo {0..100..10}
# Output: 0 10 20 30 40 50 60 70 80 90 100
# Third number is the increment

# Create multiple directories with subdirectories
mkdir -p project/{src,bin,lib,docs}
# Creates:
#   project/src
#   project/bin
#   project/lib
#   project/docs
# Comma-separated list creates multiple items

# Combine brace expansion with other text
mkdir -p year_2024/{jan,feb,mar}/{week1,week2,week3,week4}
# Creates nested structure: 
# year_2024/jan/week1, year_2024/jan/week2, etc.
# All 12 directories (3 months × 4 weeks) in one command

# Create backup files easily
cp important_file.txt{,.bak}
# Expands to: cp important_file.txt important_file.txt.bak
# The first {} is empty (original name), second adds .bak
```

**Pro Tip:** Brace expansion happens BEFORE wildcards are processed, so you can combine them for even more power.

#### Practical Examples - Combining Commands and Wildcards

```bash
# Copy all text files to a backup directory
cp *.txt backup/
# Finds all .txt files and copies them
# backup/ directory must exist first

# Delete all files starting with 'temp'
rm temp*
# ⚠️ Be careful! This deletes multiple files at once
# Consider using rm -i temp* for safety

# Delete files with specific pattern
rm file[0-9].txt
# Deletes file0.txt through file9.txt
# Does NOT delete file10.txt or fileA.txt

# Move all images to an images folder
mv *.jpg *.png images/
# Moves all .jpg and .png files
# Last argument must be a directory

# List all hidden configuration files
ls -la ~/.*
# Files starting with a dot are hidden
# Common examples: .bashrc, .vimrc, .ssh

# Count how many log files exist
ls *.log | wc -l
# ls *.log lists all .log files
# | (pipe) sends output to next command
# wc -l counts the lines (one per file)

# Find files modified in the last 7 days
find . -name "*.txt" -mtime -7
# Searches current directory (.)
# Looks for .txt files
# Modified in the last 7 days
```

---

#### Exercise 1.4: Wildcards and Patterns

**Objective:** Practice efficient file operations using wildcards.

1. Create 15 files named `test1.txt` through `test15.txt` using brace expansion
2. List only files `test1.txt` through `test9.txt` using a single ls command with wildcards
3. Create a directory called `first_batch`
4. Copy files `test1.txt` through `test5.txt` to `first_batch` using wildcards
5. Delete files `test10.txt` through `test15.txt` using a single rm command with wildcards
6. Create a directory structure with subdirectories: `myproject/{docs,images,scripts,configs}`
7. Verify your directory structure with `ls -R myproject`

**Expected Results:**
- You should have `test1.txt` through `test9.txt` remaining
- `first_batch` should contain `test1.txt` through `test5.txt`
- `myproject` should have 4 subdirectories

**Success Check:**
```bash
# Should show 9 files
ls test*.txt | wc -l

# Should show 4 directories
ls myproject | wc -l
```

---

#### Challenge 1.4: Advanced Pattern Manipulation

**Objective:** Master complex wildcard patterns and bulk operations.

1. Create 100 files named `log001.txt` through `log100.txt` using brace expansion with leading zeros
2. Create a directory called `even_logs`
3. Move only the even-numbered files (log002.txt, log004.txt, etc.) to `even_logs`
   - Hint: Think about patterns - you might need multiple commands or a loop
4. Count how many odd-numbered files remain
5. Delete all odd-numbered files that are greater than log050.txt

**Hints:**
- Consider which wildcards or patterns can help identify even numbers
- You might need to think creatively or use multiple commands
- For advanced users: a simple for loop could help (we'll learn these formally later)

**This is intentionally challenging!** The goal is to make you think about how patterns work. It's okay if you need to look up solutions or ask for help.

---

## Week 2: System Information & Command Line Mastery

### Day 5: System Information Commands

Understanding your system's hardware, resources, and current state is essential for administration and troubleshooting. Linux provides numerous commands to gather this information. These commands help you monitor performance, diagnose issues, and understand your environment.

#### Basic System Information

```bash
# Display all system information at once
uname -a
# Shows: kernel name, hostname, kernel version, hardware architecture
# Example output: Linux raspberrypi 5.10.17-v7l+ #1403 SMP Mon Feb 22 11:33:35 GMT 2021 armv7l GNU/Linux
# Useful for quickly identifying system configuration

# Show kernel version only
uname -r
# Example: 5.10.17-v7l+
# Important for checking compatibility with software

# Show hardware architecture
uname -m
# Common outputs: x86_64 (64-bit PC), armv7l (32-bit ARM), aarch64 (64-bit ARM)
# Tells you which software binaries your system can run

# Display computer hostname (network name)
hostname
# Shows the name of your machine on the network
# Example: raspberrypi or ubuntu-desktop

# Detailed hostname and system information
hostnamectl
# Shows: hostname, icon name, chassis type, machine ID, boot ID, OS, kernel
# More comprehensive than just 'hostname'
# Example use: Verifying system identity in scripts
```

#### Hardware Information

```bash
# Display CPU information
lscpu
# Shows: architecture, CPU cores, threads, model name, MHz, cache sizes
# Key information for understanding processing power
# Look for: "CPU(s)" for core count, "Model name" for processor type

# Display memory (RAM) information
lsmem
# Shows: available memory, memory blocks, online/offline ranges
# Less commonly used than 'free'
# More detailed than 'free' for memory architecture

# Display block devices (hard drives, SSDs, USB drives)
lsblk
# Shows: device names, sizes, mount points, types
# Example output:
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
# sda      8:0    0  500G  0 disk 
# ├─sda1   8:1    0  100M  0 part /boot
# └─sda2   8:2    0  400G  0 part /
# Useful for identifying which device is which

# List USB devices connected to the system
lsusb
# Shows all USB devices with vendor and product IDs
# Helpful for troubleshooting USB problems
# Example: Bus 001 Device 003: ID 046d:c52b Logitech, Inc.

# List PCI devices (internal hardware)
lspci
# Shows: graphics cards, network cards, sound cards, etc.
# Example: 00:02.0 VGA compatible controller: Intel Corporation HD Graphics 620
# Useful for driver troubleshooting

# Display detailed hardware information
sudo lshw
# Comprehensive hardware report
# Can be long - consider: sudo lshw -short for summary
# Shows everything: CPU, RAM, storage, network, USB, etc.
# Often requires sudo for complete information
```

#### Memory and Disk Usage

```bash
# Show memory usage in human-readable format
free -h
# -h flag shows GB/MB instead of bytes
# Output columns:
#   - total: Total installed RAM
#   - used: Currently in use
#   - free: Completely unused
#   - shared: Memory used by tmpfs
#   - buff/cache: Used for system caching (can be reclaimed)
#   - available: Memory available for new applications

# Example output:
#               total        used        free      shared  buff/cache   available
# Mem:           7.7G        2.1G        3.2G        156M        2.4G        5.1G
# Swap:          2.0G          0B        2.0G

# Show disk space usage for all filesystems
df -h
# -h flag shows GB/MB/KB instead of blocks
# Shows: filesystem, size, used, available, use%, mounted on
# Look for high use% - over 90% can cause problems

# Example output:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda2       457G  123G  311G  29% /
# /dev/sda1        96M   32M   65M  34% /boot

# Show only specific filesystem types
df -h -t ext4
# -t specifies filesystem type
# Common types: ext4, ext3, xfs, ntfs, vfat

# Show disk usage of current directory
du -h
# Lists size of each subdirectory
# Can be overwhelming for large directory trees

# Show total size of current directory
du -sh
# -s flag means "summary" - just the total
# -h for human-readable
# Example: 2.3G    /home/user/Documents

# Show size of each item in current directory
du -sh *
# Lists size of each file and directory
# Useful for finding what's taking up space
# Example output:
# 1.2G    Documents
# 45M     Downloads
# 234K    scripts

# Find largest directories (top 10)
du -h | sort -hr | head -10
# du -h: sizes in human-readable format
# sort -hr: sort by size, human-readable, reverse (largest first)
# head -10: show only top 10
# Great for finding space hogs
```

#### System Monitoring and Status

```bash
# Display running processes (basic)
top
# Real-time view of system processes
# Shows: CPU usage, memory usage, process list
# Press 'q' to quit
# Press 'k' to kill a process (enter PID)
# Press 'M' to sort by memory usage
# Press 'P' to sort by CPU usage
# Press '1' to show individual CPU cores

# Better process monitor (more user-friendly)
htop
# Colorful, interactive process viewer
# Install if not present: sudo apt install htop
# Easier to use than top
# F9 to kill process, F6 to sort, F5 for tree view
# Mouse support available

# System uptime and load averages
uptime
# Shows: current time, how long system has been running, user count, load averages
# Example: 14:23:45 up 7 days, 3:42, 2 users, load average: 0.15, 0.20, 0.18
# Load averages: 1 minute, 5 minute, 15 minute averages
# Load > number of CPU cores indicates system is busy

# Display current date and time
date
# Shows: Day Month Date Time Timezone Year
# Example: Thu Jan 15 14:23:45 UTC 2024

# Display custom date format
date "+%Y-%m-%d %H:%M:%S"
# Output: 2024-01-15 14:23:45
# Useful for timestamps in scripts

# Show calendar for current month
cal
# Displays a formatted calendar
# Current day is highlighted

# Show calendar for specific month/year
cal 12 2024
# Shows December 2024

# Show calendar for entire year
cal 2024
```

#### Checking Running Services

```bash
# List all running services (systemd systems)
systemctl list-units --type=service --state=running
# Shows which services are currently active
# Important for troubleshooting and security

# Check status of specific service
systemctl status ssh
# Shows if service is running, recent logs, and configuration info
# Example services: ssh, apache2, mysql, nginx

# See which ports are in use
sudo netstat -tulpn
# -t: TCP ports
# -u: UDP ports
# -l: listening ports
# -p: show program name
# -n: show numerical addresses
# Useful for finding what's using a particular port

# Alternative: using ss (faster than netstat)
sudo ss -tulpn
# Newer, faster replacement for netstat
# Same options and similar output
```

---

#### Exercise 1.5: System Information Gathering

**Objective:** Learn to gather and interpret system information.

1. Find and record your kernel version
2. Determine your CPU model and number of cores
3. Check your total RAM and how much is available
4. List all your disk partitions and their mount points
5. Find the total size of your `/home` directory
6. Check your system uptime
7. View your system's load average
8. Check which services are running

**Expected Results:**
- You should have a clear picture of your hardware
- You'll know if your system has sufficient resources
- You'll understand which services are active

**Documentation Practice:**
Create a text file called `system_info.txt` with all this information. This is good practice for keeping system documentation.

---

#### Challenge 1.5: System Report Creation

**Objective:** Create a comprehensive system report using command redirection.

Create a file called `system_report.txt` that contains:
1. Your hostname
2. Your kernel version
3. Your CPU model and core count
4. Total and available RAM
5. All disk partitions with sizes and usage percentages
6. System uptime
7. Current date and time
8. Top 5 largest directories in your home folder

**Requirements:**
- Use only command-line tools and output redirection
- Each piece of information should be clearly labeled
- The file should be readable and well-formatted

**Hints:**
- Use `echo` to add labels between command outputs
- Use `>` to create the file and `>>` to append
- Consider using `echo "=== Section Title ===" >> file.txt` for headers

**Example start:**
```bash
echo "=== SYSTEM REPORT ===" > system_report.txt
echo "Generated on: $(date)" >> system_report.txt
echo "" >> system_report.txt
echo "=== Hostname ===" >> system_report.txt
hostname >> system_report.txt
# ... continue for other information
```

---

### Day 6: Command Line Efficiency

Working efficiently in the terminal means less typing and faster results. Linux provides powerful tools for command history, keyboard shortcuts, and command chaining. Mastering these techniques separates beginners from power users.

#### Command History

Every command you type is saved in a history file. Learning to use this history effectively will dramatically speed up your work.

```bash
# Display your entire command history
history
# Shows numbered list of all previous commands
# Typically stores last 1000-5000 commands
# Example output:
#   1  ls -la
#   2  cd Documents
#   3  vim file.txt

# Search history for specific keyword
history | grep keyword
# Finds all commands containing "keyword"
# Example: history | grep ssh
# Shows all previous ssh commands
# Useful for finding commands you used before

# Execute command by history number
!number
# Example: !42 executes command #42 from history
# Check history first to find the number

# Execute the last command again
!!
# Runs the previous command exactly as typed
# Very useful with sudo:
sudo !!
# If you forgot sudo, this reruns last command with sudo

# Reference last argument of previous command
!$
# Example:
#   mkdir /tmp/mydir
#   cd !$
# The !$ expands to /tmp/mydir
# Saves retyping long paths or filenames

# Reference all arguments of previous command
!*
# Example:
#   touch file1.txt file2.txt file3.txt
#   rm !*
# Removes all the files you just created
# Use with caution!

# Execute the most recent command starting with specific text
!text
# Example: !ssh runs the most recent ssh command
# Be careful - this runs immediately without confirmation!

# Reverse search through history (MOST USEFUL!)
# Press: Ctrl+R
# Type part of a command and it searches backward
# Press Ctrl+R again to find previous matches
# Press Enter to execute, or use arrows to edit first
# Press Ctrl+C to cancel
# Example: Press Ctrl+R, type "ssh", see your last ssh command

# Clear command history (useful for security)
history -c
# Removes all history entries from current session
# Doesn't affect history file until you log out

# Delete specific history entry
history -d number
# Example: history -d 42 deletes command #42
# Useful for removing sensitive commands (passwords, etc.)

# Prevent command from being saved in history
# Add a space before the command:
 echo "This won't be in history"
# Note the leading space
# Useful for commands containing passwords or secrets
```

**Pro Tip:** The reverse search (Ctrl+R) is one of the most powerful productivity tools. Learn to use it instinctively!

#### Keyboard Shortcuts

These shortcuts work in most Linux terminals and will save you countless hours of typing.

```bash
# ===== NAVIGATION SHORTCUTS =====

# Ctrl+A: Move cursor to beginning of line
# Instead of holding left arrow, jump instantly to the start

# Ctrl+E: Move cursor to end of line
# Jump to the end instantly

# Ctrl+Left Arrow: Move backward one word
# Alt+B also works
# Navigate through long commands quickly

# Ctrl+Right Arrow: Move forward one word
# Alt+F also works

# ===== EDITING SHORTCUTS =====

# Ctrl+U: Delete from cursor to beginning of line
# Fast way to clear what you've typed so far
# Useful when you want to start over

# Ctrl+K: Delete from cursor to end of line
# Opposite of Ctrl+U

# Ctrl+W: Delete word before cursor
# Like backspace, but removes entire words
# Much faster than holding backspace

# Ctrl+Y: Paste what was deleted by Ctrl+U, Ctrl+K, or Ctrl+W
# "Yank" back deleted text
# Linux clipboard for terminal

# Ctrl+D: Delete character under cursor
# Alternative to Delete key

# Ctrl+H: Delete character before cursor
# Alternative to Backspace key

# Ctrl+T: Transpose (swap) two characters
# Cursor character swaps with previous character
# Fix typos quickly: "teh" → place cursor after 'e', press Ctrl+T → "the"

# ===== COMMAND EXECUTION =====

# Ctrl+C: Cancel current command/process
# Stops a running command
# Most important interrupt shortcut
# Example: Stop an infinite loop or hanging command

# Ctrl+Z: Suspend current process (send to background)
# Process stops but isn't killed
# Use 'fg' to resume, 'bg' to run in background
# Advanced users use this for job control

# Ctrl+D: Exit current shell/logout
# Alternative to typing 'exit'
# Also signals "end of input" for some programs

# Ctrl+L: Clear screen
# Same as typing 'clear'
# Doesn't clear history or stop processes
# Just makes the terminal tidy

# ===== SEARCH AND HISTORY =====

# Ctrl+R: Reverse search through history
# Already covered above - most powerful shortcut!

# Ctrl+G: Escape from reverse search
# Cancel Ctrl+R without executing anything

# Ctrl+O: Execute command and keep it in prompt
# Run command, then it appears ready to edit and run again
# Useful when repeating similar commands

# ===== SCREEN MANAGEMENT =====

# Ctrl+S: Freeze terminal output (stop scrolling)
# Pauses display - command still runs in background
# Often pressed by accident causing confusion

# Ctrl+Q: Unfreeze terminal output
# Resumes after Ctrl+S
# If your terminal seems frozen, try Ctrl+Q!

# ===== TERMINAL MULTIPLEXING =====

# Ctrl+Shift+T: Open new tab (in GNOME Terminal)
# Alt+1, Alt+2, etc: Switch between tabs
# Ctrl+Shift+W: Close current tab
# Ctrl+Shift+N: Open new terminal window
```

**Common Pitfall:** Accidentally pressing Ctrl+S freezes your terminal. Everyone does this. Just press Ctrl+Q to unfreeze!

#### Tab Completion - Your Best Friend

Tab completion is perhaps the single most important efficiency tool in Linux. It reduces typing, prevents errors, and helps discover available options.

```bash
# ===== BASIC TAB COMPLETION =====

# Complete commands
# Type first few letters, press Tab
ap<Tab>
# Completes to 'apt' or shows: apt, apt-get, apt-cache, etc.

# Complete file and directory names
ls Doc<Tab>
# Completes to 'Documents/' if it exists
# Press Tab again to cycle through matches

# Complete paths
cd /usr/lo<Tab>
# Completes to /usr/local/

# Double-tap Tab to see all possibilities
git <Tab><Tab>
# Shows all git subcommands: add, commit, push, pull, etc.
# Works for any command with subcommands

# ===== ADVANCED TAB COMPLETION =====

# Complete options/flags
command --<Tab><Tab>
# Shows all available long-form options
# Example: ls --<Tab><Tab> shows --all, --human-readable, etc.

# Complete hostnames (from /etc/hosts and SSH config)
ssh <Tab><Tab>
# Shows known hosts you can connect to

# Complete usernames
su <Tab><Tab>
# Shows available user accounts

# Complete environment variables
echo $HO<Tab>
# Completes to $HOME

# Complete package names (if bash-completion installed)
apt install fire<Tab>
# Completes to firefox if available in repositories

# ===== CONFIGURATION =====

# Install bash completion (if not present)
sudo apt install bash-completion
# Provides intelligent completion for many commands
# Understands context and options

# After installation, reload or restart shell:
source /etc/bash_completion
# Or simply close and reopen terminal
```

**Best Practice:** Use Tab completion for EVERYTHING. It's faster, more accurate, and helps you discover options you didn't know existed.

#### Aliases - Custom Shortcuts

Aliases let you create custom shortcuts for frequently used commands. Every Linux power user has a collection of personal aliases.

```bash
# ===== CREATING ALIASES =====

# Basic alias syntax
alias shortcut='command'
# Example:
alias ll='ls -lah'
# Now typing 'll' executes 'ls -lah'

# Common useful aliases
alias ..='cd ..'              # Go up one directory
alias ...='cd ../..'          # Go up two directories
alias la='ls -A'              # List all except . and ..
alias l='ls -CF'              # List with type indicators
alias grep='grep --color=auto'  # Colorize grep output
alias mkdir='mkdir -pv'       # Create parents and be verbose

# Safety aliases (ask before overwriting/deleting)
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Display aliases
alias ll
# Shows what ll is aliased to

# List all current aliases
alias
# Shows every alias currently defined

# Remove an alias
unalias ll
# Deletes the 'll' alias for current session

# ===== MAKING ALIASES PERMANENT =====

# Add aliases to your .bashrc file
nano ~/.bashrc

# Add your aliases at the end:
# My custom aliases
alias ll='ls -lah'
alias update='sudo apt update && sudo apt upgrade'
alias ports='sudo netstat -tulpn'

# After editing .bashrc, reload it:
source ~/.bashrc
# Or simply close and reopen terminal

# ===== ADVANCED ALIASES =====

# Alias with multiple commands (use ; or &&)
alias update='sudo apt update && sudo apt upgrade -y'
# && means "run second command only if first succeeds"

# Alias with functions (for more complex operations)
mkcd() {
    mkdir -p "$1" && cd "$1"
}
# Now 'mkcd newdir' creates and enters the directory
# Add this to .bashrc for permanence

# Alias that accepts parameters using functions
extract() {
    if [ -f "$1" ]; then
        case "$1" in
            *.tar.gz)  tar -xzf "$1"   ;;
            *.zip)     unzip "$1"      ;;
            *.rar)     unrar x "$1"    ;;
            *)         echo "Unsupported format" ;;
        esac
    fi
}
# Usage: extract filename.tar.gz

# ===== USEFUL ALIAS IDEAS =====

# System monitoring
alias meminfo='free -h'
alias cpuinfo='lscpu'
alias diskinfo='df -h'

# Network
alias myip='curl ifconfig.me'        # Get public IP
alias localip='hostname -I'          # Get local IP
alias ports='sudo netstat -tulanp'   # Show open ports

# Safety
alias fucking='sudo'                 # Because sometimes...
alias please='sudo'                  # Polite version

# Git shortcuts (if you use git)
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'

# Navigation
alias home='cd ~'
alias root='cd /'
alias projects='cd ~/projects'

# Quick edits
alias bashrc='nano ~/.bashrc'
alias sourcebash='source ~/.bashrc'
```

#### Command Chaining - Doing Multiple Things at Once

Chaining commands lets you execute multiple commands in sequence or based on conditions. This is essential for automation and efficient workflows.

```bash
# ===== SEQUENTIAL EXECUTION =====

# Run commands one after another (semicolon)
command1 ; command2 ; command3
# Each command runs regardless of success/failure
# Example:
cd /tmp ; ls ; pwd
# Changes to /tmp, lists contents, shows location
# All three commands execute even if one fails

# ===== CONDITIONAL EXECUTION =====

# Run second command ONLY if first succeeds (AND operator)
command1 && command2
# command2 runs only if command1 exits successfully (exit code 0)
# Example:
mkdir newdir && cd newdir
# Creates directory, then enters it
# If mkdir fails, cd won't execute (safe!)

# Real-world example:
sudo apt update && sudo apt upgrade
# Only upgrade if update succeeds
# Prevents upgrading with stale package lists

# Run second command ONLY if first fails (OR operator)
command1 || command2
# command2 runs only if command1 fails (non-zero exit code)
# Example:
ping -c 1 google.com || echo "No internet connection"
# Tries to ping Google
# If ping fails, displays error message

# ===== COMBINING OPERATORS =====

# Chain multiple conditional operations
command1 && command2 && command3 || command4
# Runs command2 if command1 succeeds
# Runs command3 if command2 succeeds
# Runs command4 if any previous command fails

# Example:
cd /project && make && make install || echo "Build failed"
# Navigate to project
# If successful, run make
# If make succeeds, run make install
# If anything fails, display error message

# ===== GROUPING COMMANDS =====

# Group commands with parentheses (runs in subshell)
(cd /tmp && ls)
# Commands run in a subshell
# After completion, you're back in original directory
# Useful for isolated operations

# Group commands with curly braces (runs in current shell)
{ command1; command2; }
# Note: Spaces and semicolons are required
# Commands affect current shell environment
# Example:
{ cd /tmp; pwd; }
# You're now in /tmp (not returned to original)

# ===== PRACTICAL EXAMPLES =====

# Update system safely
sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
# Update package list, upgrade packages, remove unused packages
# Each step only runs if previous succeeds

# Backup and compress
tar -czf backup.tar.gz important_files/ && echo "Backup complete"
# Create compressed backup
# Confirm success with message

# Download and extract
wget https://example.com/file.tar.gz && tar -xzf file.tar.gz
# Download file
# If download succeeds, extract it

# Build and deploy
./configure && make && sudo make install && echo "Installation successful" || echo "Installation failed"
# Typical software installation from source
# Clear success/failure message at the end

# Create directory structure
mkdir -p project/{src,bin,docs} && cd project && touch README.md
# Create project structure
# Navigate into project
# Create README file
# All in one line!
```

**Pro Tip:** Use `&&` for critical sequences where each step depends on the previous one. Use `;` when you want everything to run regardless.

---

#### Exercise 1.6: Command Line Efficiency

**Objective:** Practice using history, shortcuts, and command chaining.

1. Run at least 10 different commands
2. Use `history | grep` to find a specific command you ran
3. Execute a command from history using `!number`
4. Create an alias called `ports` that shows all listening ports: `alias ports='sudo netstat -tulpn'`
5. Use tab completion to navigate to `/usr/local/bin`
6. Create a command chain that:
   - Creates a directory called `test_chain`
   - Navigates into it
   - Creates three files: file1.txt, file2.txt, file3.txt
   - Lists the contents
   - All in a single line using command chaining!

**Expected Results:**
- You should be comfortable searching history
- Tab completion should feel natural
- Your alias should work when you type `ports`
- Your command chain should create the directory, files, and show confirmation

**Success Check:**
```bash
# Verify your alias exists
alias ports

# Verify your directory was created
ls -la ~/test_chain
```

**Practice Challenge:** Try to complete all navigation using ONLY keyboard shortcuts - no mouse, no backspace key (use Ctrl+W instead).

---

#### Challenge 1.6: Create a Personal Configuration

**Objective:** Build a custom, efficient command-line environment.

Create a set of at least 10 useful aliases and add them to your `.bashrc` file:

**Requirements:**
1. At least 3 navigation aliases (e.g., shortcuts to frequent directories)
2. At least 2 safety aliases (e.g., interactive rm, cp, mv)
3. At least 3 system information aliases (e.g., quick disk check, memory check)
4. At least 2 creative/fun aliases of your choice
5. Document each alias with a comment explaining what it does

**Bonus Points:**
- Create a function (not just an alias) that does something useful
- Add color customization to your prompt
- Create an alias that chains multiple commands together

**Example structure for `.bashrc`:**
```bash
# Navigation aliases
alias ..='cd ..'
alias ...='cd ../..'
alias projects='cd ~/projects'

# Safety aliases
alias rm='rm -i'
alias cp='cp -i'

# System information
alias meminfo='free -h'
# ... add more
```

After creating your aliases:
1. Save the file
2. Run `source ~/.bashrc` to load them
3. Test each alias to make sure it works
4. Show your configuration to someone (or document it) and explain what each alias does

---

### Day 7: Input/Output Redirection

Redirection and pipes are among the most powerful concepts in Linux. They allow you to chain commands together, save output to files, and build complex workflows from simple building blocks. This is the Unix philosophy: small tools that do one thing well, connected together.

#### Understanding Standard Streams

Every Linux command has three standard data streams:

1. **stdin (0)**: Standard Input - where commands read data (keyboard by default)
2. **stdout (1)**: Standard Output - where commands write normal output (screen by default)
3. **stderr (2)**: Standard Error - where commands write error messages (screen by default)

Redirection lets you control where these streams go.

#### Output Redirection

```bash
# Redirect stdout to a file (overwrites existing content)
command > file.txt
# The > operator captures output and writes to file
# ⚠️ WARNING: This REPLACES the entire file if it exists
# Example:
ls -la > directory_listing.txt
# Contents of ls -la are saved to file, not shown on screen

# Redirect and append to a file (adds to end)
command >> file.txt
# The >> operator appends instead of overwriting
# Safe for adding to existing files without losing data
# Example:
echo "New log entry" >> logfile.txt
# Adds line to end of logfile.txt

# Redirect stderr (error messages) to a file
command 2> error.txt
# The 2> redirects the error stream
# Normal output still goes to screen
# Only errors are captured
# Example:
ls /nonexistent 2> errors.log
# Error message goes to errors.log, not terminal

# Redirect both stdout and stderr to same file
command > output.txt 2>&1
# First: stdout goes to output.txt (> output.txt)
# Then: stderr goes to same place as stdout (2>&1)
# Order matters! 2>&1 must come after > output.txt

# Modern simplified syntax (bash 4+)
command &> output.txt
# Redirects both stdout and stderr to same file
# Shorter, clearer syntax
# Equivalent to: command > output.txt 2>&1

# Append both stdout and stderr
command >> output.txt 2>&1
# Appends both streams to file

# Discard output (send to the void)
command > /dev/null
# /dev/null is a special file that discards everything
# Think of it as a black hole for data
# Useful when you don't care about output
# Example:
grep -r "pattern" / 2> /dev/null
# Search entire filesystem, hide permission errors

# Discard both stdout and stderr
command &> /dev/null
# Silences command completely
# No output, no errors shown
# Useful in scripts when you only care about exit status
```

**Important:** The order matters! `command > file 2>&1` works, but `command 2>&1 > file` doesn't do what you expect.

#### Input Redirection

```bash
# Read input from a file instead of keyboard
command < input.txt
# The < operator feeds file contents to command
# Example:
wc -l < file.txt
# Counts lines in file.txt
# Different from: wc -l file.txt (which shows filename)

# Here document (multi-line input)
command << DELIMITER
line 1
line 2
line 3
DELIMITER
# Allows you to provide multiple lines of input
# DELIMITER can be any word (commonly: EOF, END, DONE)
# Example:
cat << EOF > newfile.txt
This is line 1
This is line 2
This is line 3
EOF
# Creates file with these three lines

# Here string (single line input)
command <<< "string"
# Passes a string as input to command
# Example:
bc <<< "2 + 2"
# Output: 4
# Sends calculation to bc (calculator) command
```

#### Pipes - Connecting Commands

Pipes (`|`) connect the output of one command to the input of another. This is where Linux really shines - combining simple tools to accomplish complex tasks.

```bash
# Basic pipe syntax
command1 | command2
# stdout of command1 becomes stdin of command2
# Example:
ls -l | less
# ls output is fed into less for paging
# Useful when command output is longer than screen

# Chain multiple commands
command1 | command2 | command3
# Data flows through each command in sequence
# Example:
cat /var/log/syslog | grep "error" | wc -l
# 1. Display log file
# 2. Filter for lines containing "error"
# 3. Count how many lines matched

# ===== COMMON PIPE PATTERNS =====

# Count lines, words, or characters
command | wc -l          # Count lines
command | wc -w          # Count words
command | wc -c          # Count characters

# Example:
ls | wc -l
# Counts how many files in current directory

# Sort output
command | sort           # Alphabetical sort
command | sort -r        # Reverse sort
command | sort -n        # Numerical sort
command | sort -h        # Human-readable numbers (1K, 2M, 3G)

# Example:
du -sh * | sort -h
# Shows directory sizes sorted from smallest to largest

# Remove duplicate lines
command | uniq           # Remove consecutive duplicates
command | sort | uniq    # Remove all duplicates (sort first!)
command | sort | uniq -c # Count occurrences

# Example:
history | awk '{print $2}' | sort | uniq -c | sort -rn | head -10
# Shows your 10 most-used commands

# Filter with grep
command | grep "pattern"      # Show lines matching pattern
command | grep -v "pattern"   # Show lines NOT matching pattern
command | grep -i "pattern"   # Case-insensitive search
command | grep -c "pattern"   # Count matching lines

# Example:
ps aux | grep firefox
# Shows all processes with "firefox" in the name

# Extract specific columns with awk
command | awk '{print $1}'     # Print first column
command | awk '{print $1,$3}'  # Print columns 1 and 3

# Example:
ls -l | awk '{print $9,$5}'
# Shows filename and size only

# Extract specific fields with cut
command | cut -d':' -f1        # Cut using : as delimiter, show field 1
command | cut -c1-10           # Show characters 1-10

# Example:
cat /etc/passwd | cut -d':' -f1
# Shows only usernames from passwd file

# Process line by line with while
command | while read line; do
    echo "Processing: $line"
done
# Reads each line into variable
# Useful for complex per-line processing

# Show only first N lines
command | head -n 10
# Shows first 10 lines
# Useful for limiting large outputs

# Show only last N lines
command | tail -n 10
# Shows last 10 lines

# Follow and process
tail -f /var/log/syslog | grep --line-buffered "error"
# Follows log file in real-time
# Shows only error lines as they appear
# --line-buffered ensures immediate display

# ===== ADVANCED PIPE EXAMPLES =====

# Find largest files in directory
du -ah . | sort -rh | head -20
# Lists 20 largest files/directories
# -a: all files, -h: human-readable
# sort -rh: reverse sort by human-readable size

# Find most common words in a file
cat file.txt | tr ' ' '\n' | sort | uniq -c | sort -rn | head -10
# tr: translate spaces to newlines (one word per line)
# sort: sort alphabetically
# uniq -c: count duplicates
# sort -rn: sort by count, descending
# head -10: top 10 most common

# Monitor system load
while true; do
    uptime | awk '{print $10,$11,$12}'
    sleep 5
done
# Shows load average every 5 seconds
# Ctrl+C to stop

# Find IP addresses in log file
grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' /var/log/syslog | sort | uniq -c | sort -rn
# Extracts all IP addresses
# Counts occurrences
# Sorts by frequency

# Disk usage pie chart (text-based)
df -h | grep "^/dev" | awk '{print $5, $6}' | sort -rn
# Shows mount points sorted by usage percentage
```

#### Tee - Split Output to Multiple Destinations

```bash
# Write to file AND display on screen
command | tee file.txt
# tee duplicates the stream
# One copy goes to file, one to stdout (screen)
# Useful when you want to see AND save output

# Example:
ls -la | tee directory_listing.txt
# Shows directory listing on screen
# Also saves it to file

# Append instead of overwrite
command | tee -a file.txt
# -a flag means append
# Adds to file instead of replacing

# Write to multiple files
command | tee file1.txt file2.txt file3.txt
# Sends output to multiple files simultaneously

# Combine with sudo (save privileged output)
echo "new line" | sudo tee -a /etc/hosts
# Append to a file requiring root permissions
# Useful when: sudo echo "text" >> /file doesn't work
# (sudo applies to echo, not the redirection)

# Monitor and save logs simultaneously
tail -f /var/log/syslog | tee -a monitoring.log
# Watch logs on screen
# Also save to monitoring.log for later review
```

#### Process Substitution (Advanced)

```bash
# Treat command output as a file
diff <(command1) <(command2)
# Compares output of two commands
# <(command) creates a temporary file-like object
# Example:
diff <(ls dir1) <(ls dir2)
# Compares contents of two directories

# Multiple inputs
paste <(command1) <(command2)
# Merges outputs side by side
```

---

#### Exercise 1.7: Redirection and Pipes

**Objective:** Master input/output redirection and command piping.

1. List your home directory contents and save to a file called `home_contents.txt`
2. Append your current working directory to that same file
3. Count how many files are in `/usr/bin`
4. Find all lines in `/etc/passwd` that contain your username
5. Create a file called `system_summary.txt` that contains:
   - Current date and time
   - Your hostname
   - Disk usage
   - Memory usage
   (Use redirection and command chaining)
6. Display the 10 largest files in your home directory, sorted by size
7. Count how many running processes contain the word "systemd"
8. Find your 5 most frequently used commands

**Expected Results:**
- `home_contents.txt` should contain directory listing and pwd output
- `system_summary.txt` should be a nicely formatted report
- You should be comfortable combining multiple commands with pipes

**Success Check:**
```bash
# Verify home_contents.txt exists and has content
wc -l home_contents.txt

# Verify system_summary.txt has multiple sections
cat system_summary.txt
```

---

#### Challenge 1.7: Build a System Monitor Script

**Objective:** Create a script that uses everything you've learned: redirection, pipes, and command chaining.

Create a file called `monitor.sh` that:

1. Clears the terminal
2. Displays a header with the current date and time
3. Shows system uptime
4. Shows memory usage
5. Shows disk usage
6. Lists the top 5 processes by CPU usage
7. Lists the top 5 processes by memory usage
8. Shows the 5 most recent log entries from `/var/log/syslog` (if accessible)
9. Saves all this information to a file called `system_monitor_[timestamp].txt`
10. Displays a message: "Report saved to: [filename]"

**Requirements:**
- Use pipes to format and filter output
- Use redirection to save to file
- Use command substitution for the timestamp: `$(date +%Y%m%d_%H%M%S)`
- Make the output readable and well-formatted

**Hints:**
```bash
# Start with shebang
#!/bin/bash

# Timestamp example
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="system_monitor_$TIMESTAMP.txt"

# Use tee to show and save simultaneously
{
    echo "=== System Monitor Report ==="
    echo "Generated: $(date)"
    echo ""
    # ... add more sections
} | tee "$REPORT"
```

**Bonus Challenge:**
- Add color to the terminal output (but not to the file)
- Make the script executable: `chmod +x monitor.sh`
- Schedule it to run every hour using `cron` (we'll learn this formally later)

---

## Module Summary

Congratulations! You've completed Module 1 and built a solid foundation in Linux fundamentals.

### Key Skills Acquired

**Week 1:**
- ✅ Terminal navigation using `cd`, `pwd`, and path concepts
- ✅ File operations: creating, copying, moving, and deleting files and directories
- ✅ File viewing and editing with multiple tools (`cat`, `less`, `nano`, `vim`)
- ✅ Efficient file management using wildcards and brace expansion
- ✅ Pattern matching for bulk operations

**Week 2:**
- ✅ System information gathering (`uname`, `free`, `df`, `lscpu`, `lsblk`)
- ✅ Command history management and searching
- ✅ Productivity shortcuts and keyboard navigation
- ✅ Creating custom aliases for efficiency
- ✅ Command chaining for workflow automation
- ✅ Input/output redirection and stream management
- ✅ Pipes for connecting commands and building complex operations

### Essential Commands Learned

**Navigation & Files:**
- `pwd`, `cd`, `ls`, `touch`, `mkdir`, `cp`, `mv`, `rm`, `cat`, `less`, `head`, `tail`

**System Information:**
- `uname`, `hostname`, `free`, `df`, `du`, `lscpu`, `lsblk`, `top`, `htop`, `uptime`

**Efficiency Tools:**
- `history`, `alias`, `!!`, `!$`, `Ctrl+R`, tab completion

**Redirection & Pipes:**
- `>`, `>>`, `<`, `|`, `tee`, `grep`, `wc`, `sort`, `uniq`

### Best Practices You've Learned

1. **Always use tab completion** - saves time and prevents errors
2. **Use `-i` flag with `rm`, `cp`, `mv`** - prevents accidental data loss
3. **Read man pages** - `man command` is your friend
4. **Check before you act** - use `ls` before `rm`, `pwd` before destructive operations
5. **Use `&&` for dependent commands** - ensures each step succeeds
6. **Save command output** - redirection captures information for later
7. **Search command history** - Ctrl+R is your productivity superpower
8. **Create aliases for frequent tasks** - customize your environment
9. **Chain commands with pipes** - build complex operations from simple tools
10. **Always know where you are** - use `pwd` frequently when learning

### Common Mistakes to Avoid

- ❌ Using `rm -rf` without double-checking the path
- ❌ Forgetting the `-r` flag when copying directories
- ❌ Not using quotes around filenames with spaces
- ❌ Confusing `>` (overwrite) with `>>` (append)
- ❌ Trying to type in vim's normal mode (press `i` first!)
- ❌ Ignoring error messages instead of reading them
- ❌ Not backing up before making system changes
- ❌ Using wildcards with destructive commands without testing first

### What's Next?

In **Module 2: File System & Permissions**, you'll learn:
- Linux file system hierarchy and structure
- File and directory permissions (rwx)
- Ownership and groups
- Special permissions (setuid, setgid, sticky bit)
- File attributes and extended attributes
- Finding files with `find` and `locate`
- File compression and archiving

### Self-Assessment Checklist

Before moving to Module 2, ensure you can:

- [ ] Navigate to any directory using absolute and relative paths
- [ ] Create, copy, move, and delete files and directories safely
- [ ] View file contents using multiple methods
- [ ] Edit files using at least one text editor comfortably
- [ ] Use wildcards to perform bulk operations
- [ ] Find and execute commands from your history
- [ ] Create and use custom aliases
- [ ] Redirect command output to files
- [ ] Chain multiple commands using pipes
- [ ] Extract and filter information using `grep`, `sort`, `uniq`, `wc`
- [ ] Gather system information confidently
- [ ] Read and understand man pages

### Practice Recommendations

To solidify these skills:

1. **Daily Practice:** Spend 10-15 minutes each day using only the terminal for file management
2. **Challenge Yourself:** Try to accomplish tasks using fewer commands (pipes and chaining)
3. **Build Something:** Create a directory structure for a project using command-line tools
4. **Document:** Keep notes on useful commands and aliases you discover
5. **Teach Someone:** Explaining concepts to others reinforces your understanding
6. **Explore:** Use `ls`, `cd`, and `cat` to explore your system's directory structure
7. **Read Logs:** Practice using `tail -f`, `grep`, and `less` on `/var/log` files
8. **Create Scripts:** Start writing simple bash scripts combining commands you've learned

### Additional Resources

- **Man Pages:** Your built-in documentation (`man command`)
- **Online:** Linux Journey (linuxjourney.com) - excellent interactive tutorials
- **Books:** "The Linux Command Line" by William Shotts (free PDF available)
- **Practice:** OverTheWire's "Bandit" wargame for command-line practice
- **Community:** Reddit's r/linux4noobs, r/linuxquestions for help

---

## Final Notes

You've taken your first major steps into the Linux world. The terminal might have seemed intimidating at first, but you now have the fundamental skills that every Linux professional uses daily. These aren't just theoretical concepts—you'll use these commands and techniques constantly.

Remember: **everyone was a beginner once.** Every expert Linux administrator started by learning `pwd` and `ls`. The difference between a beginner and an expert is simply practice and persistence.

Keep practicing, stay curious, and don't be afraid to experiment (in safe environments). Linux rewards curiosity and punishes recklessness, so always think before executing destructive commands, but don't let caution prevent you from exploring.

**You're ready for Module 2!** When you are, we'll dive deeper into the Linux file system structure and the powerful permission system that keeps Linux secure.

---

*End of Module 1*

**When you're ready to continue, please review this module and provide your feedback. Then say "continue" to proceed to Module 2: File System & Permissions.**