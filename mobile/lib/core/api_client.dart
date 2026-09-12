import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../data/models/corpus.dart';
import '../data/models/diwan.dart';
import '../data/models/poem.dart';

/// An error while calling the API, with a message ready to show to the reader.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get notFound => statusCode == 404;

  @override
  String toString() => message;
}

/// Calls the read-only Django API (/api/v1/...). Only published poems are returned.
class ApiClient {
  ApiClient(this.baseUrl, {http.Client? client}) : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;

  static const _timeout = Duration(seconds: 15);

  Future<CorpusOverview> corpus() async {
    final data = await _get('/corpus/') as Map<String, dynamic>;
    return CorpusOverview.fromJson(data);
  }

  Future<List<DiwanSummary>> diwans() async {
    final data = await _get('/diwans/') as List<dynamic>;
    return data.map((e) => DiwanSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<DiwanDetail> diwan(String slug) async {
    final data = await _get('/diwans/${Uri.encodeComponent(slug)}/') as Map<String, dynamic>;
    return DiwanDetail.fromJson(data);
  }

  Future<PoemDetail> poem(String diwanSlug, String poemSlug) async {
    final path = '/diwans/${Uri.encodeComponent(diwanSlug)}/poems/${Uri.encodeComponent(poemSlug)}/';
    final data = await _get(path) as Map<String, dynamic>;
    return PoemDetail.fromJson(data);
  }

  Future<dynamic> _get(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    http.Response response;
    try {
      response = await _client.get(uri, headers: const {'Accept': 'application/json'}).timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Le serveur ne répond pas. Vérifiez son adresse dans les paramètres : $baseUrl');
    } catch (_) {
      throw ApiException('Impossible de joindre le serveur. Vérifiez son adresse dans les paramètres : $baseUrl');
    }

    if (response.statusCode == 404) {
      throw ApiException('Ce contenu n\u2019est pas (encore) en ligne.', statusCode: 404);
    }
    if (response.statusCode == 400) {
      // Django answers 400 when the address is not in its ALLOWED_HOSTS
      throw ApiException(
        'Le serveur a refusé l\u2019adresse « ${uri.host} ». Sur l\u2019ordinateur, ajoutez-la à '
        'DJANGO_ALLOWED_HOSTS (ou laissez DEBUG activé, qui accepte toutes les adresses), puis relancez le serveur.',
        statusCode: 400,
      );
    }
    if (response.statusCode != 200) {
      throw ApiException('Erreur du serveur (${response.statusCode}).', statusCode: response.statusCode);
    }
    // Always decode as UTF-8: without it, the Arabic text would be garbled.
    return jsonDecode(utf8.decode(response.bodyBytes));
  }
}
