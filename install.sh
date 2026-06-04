#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/anomalyco/sdd-workflow-plugin.git"
INSTALL_DIR="${SDD_INSTALL_DIR:-$HOME/.local/share/sdd-workflow-plugin}"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.jsonc"
OPENCODE_SKILLS_DIR="$HOME/.config/opencode/skills/sdd-workflow"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${CYAN}[INFO]${NC}  %s\n" "$1"; }
ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
err()   { printf "${RED}[ERR]${NC}   %s\n" "$1"; }

check_prerequisites() {
    info "Checking prerequisites..."

    missing=0

    if ! command -v git &>/dev/null; then
        err "git not found. Install: sudo apt install git (or equivalent)"
        missing=1
    fi

    if ! command -v node &>/dev/null; then
        err "node not found. Install: https://nodejs.org or via nvm"
        missing=1
    fi

    if ! command -v npm &>/dev/null; then
        err "npm not found. It comes with Node.js"
        missing=1
    fi

    node_version=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
    if [ "${node_version:-0}" -lt 18 ]; then
        err "Node.js >= 18 required (current: $(node -v 2>/dev/null || echo 'unknown'))"
        missing=1
    fi

    if [ "$missing" -ne 0 ]; then
        err "Prerequisites not met. Abort."
        exit 1
    fi

    ok "All prerequisites satisfied"
}

clone_repo() {
    info "Cloning sdd-workflow-plugin..."

    if [ -d "$INSTALL_DIR" ] && [ -d "$INSTALL_DIR/.git" ]; then
        warn "Existing installation found at $INSTALL_DIR"
        info "Updating via git pull..."
        git -C "$INSTALL_DIR" pull --rebase || {
            err "git pull failed. Try removing $INSTALL_DIR and re-run."
            exit 1
        }
    else
        rm -rf "$INSTALL_DIR"
        git clone "$REPO_URL" "$INSTALL_DIR" || {
            err "git clone failed. Check REPO_URL or network."
            exit 1
        }
    fi

    ok "Repository ready at $INSTALL_DIR"
}

build_plugin() {
    info "Building sdd-workflow-plugin..."

    cd "$INSTALL_DIR"

    npm install --production=false || {
        err "npm install failed."
        exit 1
    }

    npm run build || {
        err "npm run build (tsc) failed."
        exit 1
    }

    ok "Plugin built successfully"
}

deploy_skills() {
    info "Deploying skill definitions to opencode skills directory..."

    mkdir -p "$OPENCODE_SKILLS_DIR"

    if [ -d "$INSTALL_DIR/.sdd/skills" ]; then
        cp -r "$INSTALL_DIR/.sdd/skills/"* "$OPENCODE_SKILLS_DIR/" 2>/dev/null || true
        ok "Skills deployed to $OPENCODE_SKILLS_DIR"
    else
        warn "No bundled skills directory found — skill dispatch will rely on installed agent skills"
    fi
}

configure_opencode() {
    info "Configuring opencode global config at $OPENCODE_CONFIG"

    mkdir -p "$(dirname "$OPENCODE_CONFIG")"

    plugin_path="$INSTALL_DIR"

    if [ -f "$OPENCODE_CONFIG" ]; then
        existing_plugin=$(grep -o '"plugin"' "$OPENCODE_CONFIG" 2>/dev/null || true)

        if [ -n "$existing_plugin" ]; then
            already=$(python3 -c "
import json, re, sys
raw = open('$OPENCODE_CONFIG').read()
# strip jsonc comments
raw = re.sub(r'//.*', '', raw)
raw = re.sub(r'/\*.*?\*/', '', raw, flags=re.DOTALL)
cfg = json.loads(raw)
plugins = cfg.get('plugin', [])
if '$plugin_path' in plugins:
    print('YES')
else:
    print('NO')
" 2>/dev/null || echo "UNKNOWN")

            if [ "$already" = "YES" ]; then
                ok "Plugin already registered in opencode config"
                return 0
            fi

            info "Adding plugin to existing config..."

            python3 -c "
import json, re, sys
raw = open('$OPENCODE_CONFIG').read()
raw = re.sub(r'//.*', '', raw)
raw = re.sub(r'/\*.*?\*/', '', raw, flags=re.DOTALL)
cfg = json.loads(raw)
plugins = cfg.get('plugin', [])
if isinstance(plugins, str):
    plugins = [plugins]
if '$plugin_path' not in plugins:
    plugins.append('$plugin_path')
cfg['plugin'] = plugins
# preserve skills.paths if exists
skills = cfg.get('skills', {})
paths = skills.get('paths', [])
target = '$OPENCODE_SKILLS_DIR'
if target not in paths:
    paths.append(target)
skills['paths'] = paths
cfg['skills'] = skills
print(json.dumps(cfg, indent=2))
" > "$OPENCODE_CONFIG.tmp" 2>/dev/null || {
                err "python3 config merge failed. Falling back to manual config."
                configure_opencode_manual
                return
            }

            mv "$OPENCODE_CONFIG.tmp" "$OPENCODE_CONFIG"
            ok "Plugin added to existing opencode config"
        else
            warn "Config has no 'plugin' field yet. Appending minimal config."
            configure_opencode_manual
        fi
    else
        info "Creating new opencode config..."
        configure_opencode_manual
    fi
}

configure_opencode_manual() {
    if [ ! -f "$OPENCODE_CONFIG" ]; then
        cat > "$OPENCODE_CONFIG" <<'NEWCFG'
{
  "$schema": "https://opencode.ai/config.json",
NEWCFG
        # append plugin + skills
        printf '  "plugin": ["%s"],\n  "skills": {\n    "paths": ["%s"]\n  }\n}\n' \
            "$plugin_path" "$OPENCODE_SKILLS_DIR" >> "$OPENCODE_CONFIG"
        ok "New opencode config created"
        return
    fi

    # append to existing file without python3
    # read entire file, remove last closing brace, append new fields, close
    tmp=$(mktemp)
    {
        # strip trailing whitespace + last }
        sed '/^}$/{$d}' "$OPENCODE_CONFIG"
        # check if last non-empty line ends with comma
        last_line=$(sed '/^$/d' "$OPENCODE_CONFIG" | tail -1)
        if [[ "$last_line" =~ , ]]; then
            printf '  "plugin": ["%s"],\n  "skills": {\n    "paths": ["%s"]\n  }\n}\n' \
                "$plugin_path" "$OPENCODE_SKILLS_DIR"
        else
            printf ',\n  "plugin": ["%s"],\n  "skills": {\n    "paths": ["%s"]\n  }\n}\n' \
                "$plugin_path" "$OPENCODE_SKILLS_DIR"
        fi
    } > "$tmp"
    mv "$tmp" "$OPENCODE_CONFIG"
    ok "Plugin appended to opencode config"
}

verify_installation() {
    info "Verifying installation..."

    [ -f "$INSTALL_DIR/dist/index.js" ] || { err "dist/index.js not found — build may have failed"; exit 1; }
    [ -f "$INSTALL_DIR/bin/sdd.js" ]    || { err "bin/sdd.js not found"; exit 1; }
    [ -f "$OPENCODE_CONFIG" ]            || { err "opencode config not created"; exit 1; }

    ok "dist/index.js exists"
    ok "bin/sdd.js exists"
    ok "opencode config updated"

    info "Running sdd CLI smoke test..."
    cd "$INSTALL_DIR"
    node bin/sdd.js help || { err "sdd CLI test failed"; exit 1; }
    ok "sdd CLI works"

    info "Checking opencode config contains plugin..."
    grep -q "$INSTALL_DIR" "$OPENCODE_CONFIG" || { err "Plugin path not found in opencode config"; exit 1; }
    ok "Plugin registered in opencode config"
}

print_summary() {
    echo ""
    printf "${GREEN}========================================${NC}\n"
    printf "${GREEN}  SDD-Workflow Plugin Installed!${NC}\n"
    printf "${GREEN}========================================${NC}\n"
    echo ""
    printf "  Install dir : ${CYAN}%s${NC}\n" "$INSTALL_DIR"
    printf "  Config file : ${CYAN}%s${NC}\n" "$OPENCODE_CONFIG"
    printf "  Skills dir  : ${CYAN}%s${NC}\n" "$OPENCODE_SKILLS_DIR"
    echo ""
    printf "  CLI usage   : ${CYAN}node %s/bin/sdd.js <command>${NC}\n" "$INSTALL_DIR"
    echo ""
    printf "  Quick start in any project dir:\n"
    printf "    ${CYAN}sdd init${NC}              # initialize SDD project\n"
    printf "    ${CYAN}sdd start my-feature${NC}   # start feature workflow\n"
    printf "    ${CYAN}sdd status${NC}             # check current state\n"
    printf "    ${CYAN}sdd gate 1 check${NC}        # check phase gate\n"
    echo ""
    printf "  Plugin auto-loads when opencode starts.\n"
    printf "  Re-run this script to update.\n"
    echo ""
    printf "${GREEN}========================================${NC}\n"
}

cleanup_on_failure() {
    err "Installation failed. Partial files may remain at:"
    err "  $INSTALL_DIR"
    err "  $OPENCODE_CONFIG"
    err "Remove them manually if needed, then re-run."
}

main() {
    trap cleanup_on_failure ERR

    info "SDD-Workflow Plugin — one-click installer for Linux"
    echo ""

    check_prerequisites
    clone_repo
    build_plugin
    deploy_skills
    configure_opencode
    verify_installation
    print_summary
}

main "$@"