import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/settings.dart';
import 'core/theme.dart';
import 'features/home/home_screen.dart';

class DiwanApp extends StatelessWidget {
  const DiwanApp({super.key, required this.settings});

  final AppSettings settings;

  @override
  Widget build(BuildContext context) {
    return SettingsScope(
      settings: settings,
      child: MaterialApp(
        title: 'Diwan',
        debugShowCheckedModeBanner: false,
        theme: buildDiwanTheme(),
        locale: const Locale('fr'),
        supportedLocales: const [Locale('fr')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: const HomeScreen(),
      ),
    );
  }
}
