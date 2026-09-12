import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';

/// The address of the Django API, to reach the computer from an emulator or a real phone.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _controller = TextEditingController();
  bool _initialised = false;
  bool _testing = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialised) {
      _controller.text = SettingsScope.of(context).apiBaseUrl;
      _initialised = true;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    await SettingsScope.of(context).setApiBaseUrl(_controller.text);
    if (!mounted) return;
    _controller.text = SettingsScope.of(context).apiBaseUrl;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Adresse enregistrée.')));
  }

  Future<void> _test() async {
    setState(() => _testing = true);
    final url = _controller.text.trim().replaceAll(RegExp(r'/+$'), '');
    String message;
    try {
      final corpus = await ApiClient(url).corpus();
      message = 'Connexion réussie : ${plural(corpus.poemCount, 'khassida', 'khassaïdes')} en ligne.';
    } catch (e) {
      message = '$e';
    }
    if (!mounted) return;
    setState(() => _testing = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Adresse du serveur', style: TextStyle(fontFamily: arabicFont, fontSize: 26, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          const Text(
            'L\u2019application lit les poèmes depuis l\u2019API Django. Pendant le développement, indiquez ici l\u2019adresse de l\u2019ordinateur qui fait tourner le backend.',
            style: TextStyle(color: DiwanColors.muted, height: 1.5),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.url,
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'Adresse de l\u2019API', hintText: 'http://192.168.1.20:8000/api/v1'),
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            ActionChip(label: const Text('Émulateur Android'), onPressed: () => _controller.text = ApiConfig.androidEmulator),
            ActionChip(label: const Text('Simulateur iOS'), onPressed: () => _controller.text = ApiConfig.localComputer),
            ActionChip(label: const Text('Valeur par défaut'), onPressed: () => _controller.text = ApiConfig.defaultBaseUrl),
          ]),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: _testing ? null : _test, child: Text(_testing ? 'Test…' : 'Tester la connexion'))),
            const SizedBox(width: 12),
            Expanded(child: FilledButton(onPressed: _save, child: const Text('Enregistrer'))),
          ]),
          const SizedBox(height: 28),
          const Text('Téléphone réel', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          const Text(
            '1. Téléphone et ordinateur sur le même Wi-Fi.\n'
            '2. Sur l\u2019ordinateur : python manage.py runserver 0.0.0.0:8000\n'
            '3. Ajouter l\u2019adresse IP de l\u2019ordinateur à DJANGO_ALLOWED_HOSTS.\n'
            '4. Ici : http://<adresse IP>:8000/api/v1',
            style: TextStyle(height: 1.6),
          ),
        ],
      ),
    );
  }
}
