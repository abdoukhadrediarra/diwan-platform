import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../features/settings/settings_screen.dart';

/// A centred message with an optional action: loading errors, empty lists, "not found".
class MessageView extends StatelessWidget {
  const MessageView({super.key, required this.title, required this.message, this.actionLabel, this.onAction, this.showSettings = false});

  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool showSettings;

  /// The right message for an error thrown while loading.
  factory MessageView.forError(Object? error, {required VoidCallback onRetry, String? notFoundMessage}) {
    final notFound = error is ApiException && error.notFound;
    return MessageView(
      title: notFound ? 'Introuvable' : 'Chargement impossible',
      message: notFound ? (notFoundMessage ?? '$error') : '$error',
      actionLabel: notFound ? null : 'Réessayer',
      onAction: notFound ? null : onRetry,
      showSettings: !notFound,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontFamily: arabicFont, fontSize: 26, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: DiwanColors.muted, height: 1.5)),
            if (actionLabel != null) ...[
              const SizedBox(height: 20),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
            if (showSettings)
              TextButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen())),
                child: const Text('Adresse du serveur'),
              ),
          ],
        ),
      ),
    );
  }
}
