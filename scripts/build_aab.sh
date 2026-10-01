#!/usr/bin/env bash
# Builds a Play Store bundle (AAB) signed with the upload key in ~/.pingo (never in this public repo).
#   scripts/build_aab.sh   →  dist/pingo-<version>-<versionCode>.aab
# Bump "version" / android.versionCode in app.json before each Play upload.
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME=${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}  # JDK 17: newer JDKs break the native build
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Library/Android/sdk}
PROPS=$HOME/.pingo/keystore.properties
[ -f "$PROPS" ] || { echo "missing $PROPS (upload key)"; exit 1; }
prop() { grep "^$1=" "$PROPS" | cut -d= -f2-; }

npx expo prebuild --platform android --no-install >/dev/null       # android/ is generated from app.json
(cd android && NODE_ENV=production ./gradlew bundleRelease -q)

VER=$(node -p "require('./app.json').expo.version")
CODE=$(node -p "require('./app.json').expo.android.versionCode")
mkdir -p dist
OUT=dist/pingo-$VER-$CODE.aab
cp android/app/build/outputs/bundle/release/app-release.aab "$OUT"
# The generated project signs release with the debug key; replace that with the upload key.
zip -q -d "$OUT" 'META-INF/*.SF' 'META-INF/*.RSA' 'META-INF/MANIFEST.MF' >/dev/null 2>&1 || true
"$JAVA_HOME/bin/jarsigner" -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$(prop storeFile)" \
  -storepass "$(prop storePassword)" -keypass "$(prop keyPassword)" "$OUT" "$(prop keyAlias)" >/dev/null
"$JAVA_HOME/bin/jarsigner" -verify "$OUT" | tail -1
echo "$OUT"
