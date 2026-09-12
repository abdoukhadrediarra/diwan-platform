import 'package:flutter/foundation.dart';

/// Where the Django API lives.
///
/// Order of priority:
///  1. the address saved in the app's Settings screen (see settings.dart);
///  2. an address given when building: `flutter run --dart-define=API_URL=https://example.org/api/v1`;
///  3. a development default: the Android emulator reaches the computer at 10.0.2.2,
///     the iOS simulator at 127.0.0.1.
class ApiConfig {
  static const String _fromBuild = String.fromEnvironment('API_URL');

  static const String androidEmulator = 'http://10.0.2.2:8000/api/v1';
  static const String localComputer = 'http://127.0.0.1:8000/api/v1';

  static String get defaultBaseUrl {
    if (_fromBuild.isNotEmpty) return _fromBuild;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) return androidEmulator;
    return localComputer;
  }
}
