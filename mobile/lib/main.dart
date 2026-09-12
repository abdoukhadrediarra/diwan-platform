import 'package:flutter/material.dart';

import 'app.dart';
import 'core/settings.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = await AppSettings.load();
  runApp(DiwanApp(settings: settings));
}
