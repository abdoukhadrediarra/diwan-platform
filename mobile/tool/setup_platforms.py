"""
Run once, right after `flutter create`, from the mobile/ folder:

    python tool/setup_platforms.py        (python3 on macOS / Linux)

Android: allows Internet access, allows plain HTTP to your computer during development, names the app "Diwan".
iOS:     allows plain HTTP to the local network during development, names the app "Diwan".
Safe to run again: nothing is added twice.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
PLIST = ROOT / "ios" / "Runner" / "Info.plist"


def patch_android() -> None:
    if not MANIFEST.exists():
        print("Android: AndroidManifest.xml not found. Run `flutter create` first.")
        return
    xml = MANIFEST.read_text(encoding="utf-8")
    before = xml
    if "android.permission.INTERNET" not in xml:
        xml = re.sub(r"(<manifest\b[^>]*>)", r'\1\n    <uses-permission android:name="android.permission.INTERNET"/>', xml, count=1)
    if "usesCleartextTraffic" not in xml:
        xml = re.sub(r"<application\b", '<application\n        android:usesCleartextTraffic="true"', xml, count=1)
    xml = re.sub(r'android:label="[^"]*"', 'android:label="Diwan"', xml, count=1)
    if xml != before:
        MANIFEST.write_text(xml, encoding="utf-8")
        print("Android: AndroidManifest.xml updated.")
    else:
        print("Android: already set up.")


def patch_ios() -> None:
    if not PLIST.exists():
        print("iOS: Info.plist not found (normal on Windows if the ios/ folder was not created).")
        return
    plist = PLIST.read_text(encoding="utf-8")
    before = plist
    if "NSAppTransportSecurity" not in plist:
        block = ("\t<key>NSAppTransportSecurity</key>\n\t<dict>\n\t\t<key>NSAllowsLocalNetworking</key>\n"
                 "\t\t<true/>\n\t</dict>\n")
        head, sep, tail = plist.rpartition("</dict>")
        plist = head + block + sep + tail
    plist = re.sub(r"(<key>CFBundleDisplayName</key>\s*<string>)[^<]*(</string>)", r"\1Diwan\2", plist, count=1)
    if plist != before:
        PLIST.write_text(plist, encoding="utf-8")
        print("iOS: Info.plist updated.")
    else:
        print("iOS: already set up.")


if __name__ == "__main__":
    patch_android()
    patch_ios()
    print("Before publishing on the stores, use an HTTPS API address and remove usesCleartextTraffic.")
