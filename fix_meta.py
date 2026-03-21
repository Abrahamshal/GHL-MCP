#!/usr/bin/env python3
"""
Fix _meta placement issues in GHL MCP tool files.

In older tool files, _meta blocks are incorrectly placed INSIDE
inputSchema.properties. This script moves them to the tool definition level.

Cases handled:
1. Standard files (6-space tool indent): _meta inside top-level properties
   (10-space close) — 325 cases
2. Standard files: _meta inside nested sub-schemas (12/14/16/22-space close)
   — 23 cases  
3. blog-tools.ts (4-space tool indent): _meta inside 6-space properties
   — 4 cases
4. blog-tools.ts: _meta at wrong indent (8-space) after inputSchema close
   — 3 cases
"""

import re
import os
import sys

TOOL_DIR = 'src/tools'


# ─────────────────────────────────────────────────────────────────────────────
# STANDARD FILES: Universal pattern (handles Cases 1 & 2)
#
# Pattern: _meta at 8 spaces, followed by content at 10+ spaces (or blank),
#          then inputSchema close at 8 spaces, then tool close at 6 spaces.
#
# This single regex handles BOTH:
#   - _meta directly inside top-level properties (close at 10 spaces)
#   - _meta inside nested sub-schemas (close at 12/14/16/22 spaces)
# ─────────────────────────────────────────────────────────────────────────────

STANDARD_PATTERN = re.compile(
    r'        _meta: \{\n'
    r'          labels: \{\n'
    r'            category: "([^"]+)",\n'
    r'            access: "([^"]+)",\n'
    r'            complexity: "([^"]+)"\n'
    r'          \}\n'
    r'        \}\n'
    r'((?:[ \t]{10,}[^\n]*\n|\n)*)'   # lines at 10+ spaces or blank lines
    r'        \}\n'                    # inputSchema close at 8 spaces (no comma)
    r'      (},?)\n',                  # tool close at 6 spaces
    re.MULTILINE
)


def replace_standard(m):
    cat, acc, cpx = m.group(1), m.group(2), m.group(3)
    middle = m.group(4)   # content between _meta and inputSchema close
    close = m.group(5)    # ',' or '' for tool close
    return (
        middle +
        '        },\n' +          # inputSchema close WITH COMMA
        '        _meta: {\n' +
        '          labels: {\n' +
        '            category: "' + cat + '",\n' +
        '            access: "' + acc + '",\n' +
        '            complexity: "' + cpx + '"\n' +
        '          }\n' +
        '        }\n' +
        '      ' + close + '\n'   # tool close
    )


# ─────────────────────────────────────────────────────────────────────────────
# BLOG-TOOLS.TS Case 3: _meta inside 6-space properties
#
# blog-tools.ts uses 4-space tool indent, so:
#   - properties: at 6 spaces
#   - field properties at 8 spaces
#   - _meta at 8 spaces (inside properties) ← WRONG
#   - properties close: 6 spaces
#   - inputSchema close: 4 spaces (NO comma)
#   - tool close: 2 spaces
# ─────────────────────────────────────────────────────────────────────────────

BLOG_CASE3_PATTERN = re.compile(
    r'        _meta: \{\n'
    r'          labels: \{\n'
    r'            category: "([^"]+)",\n'
    r'            access: "([^"]+)",\n'
    r'            complexity: "([^"]+)"\n'
    r'          \}\n'
    r'        \}\n'
    r'      \},\n'                               # 6-space properties close
    r'((?:      [^\n]*\n)*)'                     # optional lines at 6 spaces (required, etc.)
    r'    \}\n'                                  # 4-space inputSchema close (no comma)
    r'  (},?)\n',                                # 2-space tool close
    re.MULTILINE
)


def replace_blog_case3(m):
    cat, acc, cpx = m.group(1), m.group(2), m.group(3)
    optional = m.group(4)   # required line(s) at 6 spaces
    close = m.group(5)      # ',' or ''
    return (
        '      },\n' +          # 6-space properties close
        optional +              # optional required/etc
        '    },\n' +            # 4-space inputSchema close WITH COMMA
        '    _meta: {\n' +
        '      labels: {\n' +
        '        category: "' + cat + '",\n' +
        '        access: "' + acc + '",\n' +
        '        complexity: "' + cpx + '"\n' +
        '      }\n' +
        '    }\n' +
        '  ' + close + '\n'    # 2-space tool close
    )


# ─────────────────────────────────────────────────────────────────────────────
# BLOG-TOOLS.TS Case 4: _meta at wrong indent (8-space) after inputSchema close
#
# In get_blog_sites, get_blog_authors, get_blog_categories:
#   - inputSchema close at 4 spaces (WITH comma already)
#   - _meta at 8 spaces (WRONG, should be 4)
#   - tool close at 2 spaces
# ─────────────────────────────────────────────────────────────────────────────

BLOG_CASE4_PATTERN = re.compile(
    r'    \},\n'             # 4-space inputSchema close (already has comma)
    r'        _meta: \{\n'  # 8-space _meta (WRONG)
    r'          labels: \{\n'
    r'            category: "([^"]+)",\n'
    r'            access: "([^"]+)",\n'
    r'            complexity: "([^"]+)"\n'
    r'          \}\n'
    r'        \}\n'
    r'  (},?)\n',           # 2-space tool close
    re.MULTILINE
)


def replace_blog_case4(m):
    cat, acc, cpx = m.group(1), m.group(2), m.group(3)
    close = m.group(4)
    return (
        '    },\n' +            # 4-space inputSchema close (keep as-is)
        '    _meta: {\n' +      # 4-space _meta (CORRECT indent)
        '      labels: {\n' +
        '        category: "' + cat + '",\n' +
        '        access: "' + acc + '",\n' +
        '        complexity: "' + cpx + '"\n' +
        '      }\n' +
        '    }\n' +
        '  ' + close + '\n'    # 2-space tool close
    )


# ─────────────────────────────────────────────────────────────────────────────
# Main processing
# ─────────────────────────────────────────────────────────────────────────────

def fix_file(path, is_blog=False):
    with open(path) as f:
        original = f.read()

    content = original

    if is_blog:
        # Apply Case 4 first (it has the inputSchema comma already)
        new_content = BLOG_CASE4_PATTERN.sub(replace_blog_case4, content)
        # Apply Case 3 (inside properties)
        new_content = BLOG_CASE3_PATTERN.sub(replace_blog_case3, new_content)
    else:
        # Apply universal standard pattern (Cases 1 & 2)
        new_content = STANDARD_PATTERN.sub(replace_standard, content)

    if new_content != original:
        with open(path, 'w') as f:
            f.write(new_content)
        return True
    return False


def count_bad_meta(content, is_blog=False):
    """Count remaining bad _meta blocks after fixes."""
    if is_blog:
        return (len(BLOG_CASE3_PATTERN.findall(content)) +
                len(BLOG_CASE4_PATTERN.findall(content)))
    else:
        return len(STANDARD_PATTERN.findall(content))


def main():
    dry_run = '--dry-run' in sys.argv
    verbose = '--verbose' in sys.argv or '-v' in sys.argv

    total_fixed = 0
    total_files = 0

    for fname in sorted(os.listdir(TOOL_DIR)):
        if not fname.endswith('.ts'):
            continue
        path = os.path.join(TOOL_DIR, fname)
        is_blog = fname == 'blog-tools.ts'

        with open(path) as f:
            content = f.read()

        # Count bad _meta before
        bad_before = count_bad_meta(content, is_blog)
        if bad_before == 0:
            continue

        if dry_run:
            print(f"[DRY RUN] {fname}: {bad_before} bad _meta blocks")
            continue

        changed = fix_file(path, is_blog)

        if changed:
            with open(path) as f:
                new_content = f.read()
            bad_after = count_bad_meta(new_content, is_blog)
            fixed = bad_before - bad_after
            total_fixed += fixed
            total_files += 1
            if verbose or bad_after > 0:
                status = "✓" if bad_after == 0 else "⚠"
                print(f"{status} {fname}: fixed {fixed}, remaining {bad_after}")
        else:
            print(f"? {fname}: no changes made (bad_before={bad_before})")

    if not dry_run:
        print(f"\nDone: fixed {total_fixed} _meta blocks across {total_files} files")


if __name__ == '__main__':
    main()
