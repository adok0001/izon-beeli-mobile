#!/usr/bin/env python3
"""
Injects an Archive pre-action into Beeli.xcscheme that will override BeeliWidget
signing to Automatic at xcodebuild time. Must be called from the eas-build-post-install
hook (i.e. after expo prebuild but before CONFIGURE_XCODE_PROJECT).
"""
import os, re

XCSCHEME = "ios/Beeli.xcodeproj/xcshareddata/xcschemes/Beeli.xcscheme"
PBXPROJ  = "ios/Beeli.xcodeproj/project.pbxproj"

if not os.path.exists(XCSCHEME):
    print(f"[patch-xcscheme] {XCSCHEME} not found — skipping")
    raise SystemExit(0)

scheme = open(XCSCHEME).read()
if "fix-beeli-widget-signing" in scheme:
    print("[patch-xcscheme] Pre-action already present — skipping")
    raise SystemExit(0)

# Get the Beeli native target UUID from the freshly-generated pbxproj so the
# pre-action's EnvironmentBuildable can expose $PROJECT_DIR.
pbxproj = open(PBXPROJ).read()
m = re.search(r"([0-9A-F]{24}) /\* Beeli \*/ = \{[^}]*isa = PBXNativeTarget", pbxproj)
beeli_uuid = m.group(1) if m else "13B07F861A680F5B00A75B9A"  # fallback
print(f"[patch-xcscheme] Beeli target UUID: {beeli_uuid}")

PRE_ACTIONS = f"""\n      <PreActions>\n         <ExecutionAction\n            ActionType = "Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction">\n            <ActionContent\n               title = "Fix BeeliWidget Signing"\n               scriptText = "python3 &quot;$PROJECT_DIR/../scripts/fix-beeli-widget-signing.py&quot;"\n               shellToInvoke = "/bin/sh">\n               <EnvironmentBuildable>\n                  <BuildableReference\n                     BuildableIdentifier = "primary"\n                     BlueprintIdentifier = "{beeli_uuid}"\n                     BuildableName = "Beeli.app"\n                     BlueprintName = "Beeli"\n                     ReferencedContainer = "container:Beeli.xcodeproj">\n                  </BuildableReference>\n               </EnvironmentBuildable>\n            </ActionContent>\n         </ExecutionAction>\n      </PreActions>"""

# ArchiveAction can be self-closing (<ArchiveAction ... />) or open-close.
# Convert self-closing to open-close first, then append PreActions.
def inject(m):
    tag = m.group(0)
    if tag.endswith("/>"):
        tag = tag[:-2] + ">" + PRE_ACTIONS + "\n   </ArchiveAction>"
    else:
        tag = tag + PRE_ACTIONS
    return tag

new_scheme = re.sub(r"<ArchiveAction[^>]*/?>", inject, scheme)

if new_scheme == scheme:
    print("[patch-xcscheme] Could not locate ArchiveAction — skipping")
else:
    open(XCSCHEME, "w").write(new_scheme)
    print("[patch-xcscheme] Pre-action injected into Archive scheme")
