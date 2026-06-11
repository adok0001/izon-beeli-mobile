#!/usr/bin/env python3
"""
Removes CODE_SIGN_STYLE=Manual and PROVISIONING_PROFILE_SPECIFIER from the
BeeliWidget XCBuildConfiguration after EAS's CONFIGURE_XCODE_PROJECT sets them.

Why: IsXcodeManaged rejection fires when EITHER is present (PROVISIONING_PROFILE_
SPECIFIER implies manual mode). Removing both leaves only CODE_SIGN_IDENTITY and
DEVELOPMENT_TEAM, so xcodebuild searches for a profile by bundle ID + team + identity
and accepts the installed Xcode-managed distribution profile without error.

Run at Gymfile load time (after CONFIGURE_XCODE_PROJECT, before xcodebuild).
"""
import os, re, glob


def find_pbxproj():
    candidates = [
        os.path.join(os.environ.get("PROJECT_DIR", ""), "Beeli.xcodeproj", "project.pbxproj"),
        "Beeli.xcodeproj/project.pbxproj",
        "ios/Beeli.xcodeproj/project.pbxproj",
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    for pattern in [
        "/var/folders/**/**/Beeli.xcodeproj/project.pbxproj",
        "/tmp/**/Beeli.xcodeproj/project.pbxproj",
    ]:
        matches = glob.glob(pattern, recursive=True)
        if matches:
            return matches[0]
    return None


def find_config_blocks(content):
    blocks = []
    search_from = 0
    while True:
        marker = content.find("isa = XCBuildConfiguration", search_from)
        if marker == -1:
            break
        start = content.rfind("{", 0, marker)
        if start == -1:
            search_from = marker + 1
            continue
        depth, j = 0, start
        while j < len(content):
            if content[j] == "{":
                depth += 1
            elif content[j] == "}":
                depth -= 1
                if depth == 0:
                    blocks.append((start, j + 1))
                    break
            j += 1
        search_from = marker + 1
    return blocks


pbxproj = find_pbxproj()
if not pbxproj:
    print("[fix-signing] project.pbxproj not found — skipping")
    raise SystemExit(0)

print(f"[fix-signing] Patching {pbxproj}")
content = open(pbxproj).read()
blocks = find_config_blocks(content)
fixed = 0

for start, end in reversed(blocks):
    block = content[start:end]
    if 'com.izonbeeli.app.BeeliWidget' not in block:
        continue
    for line in block.splitlines():
        s = line.strip()
        if any(k in s for k in ('CODE_SIGN_STYLE', 'CODE_SIGN_IDENTITY', 'DEVELOPMENT_TEAM', 'PROVISIONING_PROFILE')):
            print(f"[fix-signing] BEFORE: {s}")
    # Remove CODE_SIGN_STYLE = Manual without replacing it.
    # Legacy signing (no explicit CODE_SIGN_STYLE) reads CODE_SIGN_IDENTITY and
    # PROVISIONING_PROFILE_SPECIFIER directly and skips the IsXcodeManaged check
    # that is tied to the explicit Manual setting introduced in Xcode 8.
    # Remove CODE_SIGN_STYLE = Manual and PROVISIONING_PROFILE_SPECIFIER.
    # IsXcodeManaged rejection fires when EITHER is present (specifier implies
    # manual mode). Without both, xcodebuild searches by bundle ID + team +
    # CODE_SIGN_IDENTITY and accepts the installed Xcode-managed profile.
    new_block = re.sub(r"\n\t+CODE_SIGN_STYLE = Manual;", "", block)
    new_block = re.sub(r"\n\t+PROVISIONING_PROFILE_SPECIFIER = [^;]+;", "", new_block)
    if new_block != block:
        content = content[:start] + new_block + content[end:]
        fixed += 1

open(pbxproj, "w").write(content)
print(f"[fix-signing] Removed CODE_SIGN_STYLE=Manual from {fixed} BeeliWidget build configuration(s)")
