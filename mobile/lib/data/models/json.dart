/// Small helpers to read JSON safely.
int readInt(Object? value) => value is num ? value.toInt() : int.tryParse('$value') ?? 0;
int? readIntOrNull(Object? value) => value == null ? null : readInt(value);
String readString(Object? value) => value == null ? '' : '$value';
List<String> readStrings(Object? value) => value is List ? value.map((e) => '$e').toList() : const [];
