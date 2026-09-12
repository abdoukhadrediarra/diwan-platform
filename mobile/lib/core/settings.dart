import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config.dart';
import 'theme.dart';

/// Settings kept on the phone: the API address and whether to show the transcription.
class AppSettings extends ChangeNotifier {
  AppSettings._(this._prefs, this._apiBaseUrl, this._showTranscription, this._script);

  static const _kApiUrl = 'api_base_url';
  static const _kTranscription = 'show_transcription';
  static const _kScript = 'arabic_script';

  final SharedPreferences _prefs;
  String _apiBaseUrl;
  bool _showTranscription;
  ArabicScript _script;

  static Future<AppSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_kScript);
    return AppSettings._(
      prefs,
      prefs.getString(_kApiUrl) ?? ApiConfig.defaultBaseUrl,
      prefs.getBool(_kTranscription) ?? false,
      ArabicScript.values.firstWhere((s) => s.name == saved, orElse: () => ArabicScript.classic),
    );
  }

  String get apiBaseUrl => _apiBaseUrl;
  bool get showTranscription => _showTranscription;

  /// Classical letterforms, or the Wolofal ones.
  ArabicScript get script => _script;

  Future<void> setScript(ArabicScript value) async {
    _script = value;
    notifyListeners();
    await _prefs.setString(_kScript, value.name);
  }

  /// Saves the API address. An empty value goes back to the default address.
  Future<void> setApiBaseUrl(String value) async {
    final cleaned = value.trim().replaceAll(RegExp(r'/+$'), '');
    if (cleaned.isEmpty) {
      _apiBaseUrl = ApiConfig.defaultBaseUrl;
      await _prefs.remove(_kApiUrl);
    } else {
      _apiBaseUrl = cleaned;
      await _prefs.setString(_kApiUrl, cleaned);
    }
    notifyListeners();
  }

  Future<void> setShowTranscription(bool value) async {
    _showTranscription = value;
    notifyListeners();
    await _prefs.setBool(_kTranscription, value);
  }
}

/// Makes [AppSettings] available to every screen.
class SettingsScope extends InheritedNotifier<AppSettings> {
  const SettingsScope({super.key, required AppSettings settings, required super.child})
      : super(notifier: settings);

  /// Reads the settings and rebuilds the caller when they change.
  static AppSettings of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<SettingsScope>()!.notifier!;
}
