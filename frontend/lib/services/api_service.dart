// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:logger/logger.dart';
import '../models/donation.dart';

class ApiService {
  // IMPORTANT: Replace with your actual backend URL
  // For local testing: 'http://10.0.2.2:8000' (Android Emulator)
  // For local testing: 'http://localhost:8000' (iOS Simulator / Web)
  // For production: 'https://your-domain.com'
  static const String baseUrl = 'http://localhost:8000';
  static const String wsUrl = 'ws://localhost:8000';

  final Logger _logger = Logger();
  WebSocketChannel? _channel;

  // =========================================================================
  // HTTP ENDPOINTS
  // =========================================================================

  /// Fetch all available donations
  Future<List<Donation>> getAvailableDonations() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/donations/available'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Donation.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load donations: ${response.statusCode}');
      }
    } catch (e) {
      _logger.e('Error fetching donations: $e');
      rethrow;
    }
  }

  /// Fetch map markers (lightweight endpoint)
  Future<List<MapMarker>> getMapMarkers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/map/markers'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => MapMarker.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load markers: ${response.statusCode}');
      }
    } catch (e) {
      _logger.e('Error fetching markers: $e');
      rethrow;
    }
  }

  /// Fetch specific donation details
  Future<Donation> getDonationById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/donations/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return Donation.fromJson(json.decode(response.body));
      } else {
        throw Exception('Donation not found: ${response.statusCode}');
      }
    } catch (e) {
      _logger.e('Error fetching donation $id: $e');
      rethrow;
    }
  }

  /// Update donation status (for testing)
  Future<void> updateDonationStatus(int id, DonationStatus status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/donations/$id/status?new_status=${status.toString().split('.').last}'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update status: ${response.statusCode}');
      }
    } catch (e) {
      _logger.e('Error updating donation status: $e');
      rethrow;
    }
  }

  /// Create new donation (for testing)
  Future<Donation> createDonation({
    required String donorName,
    required String donorPhone,
    required FoodType foodType,
    required double quantityKg,
    String? description,
    required double latitude,
    required double longitude,
    required String address,
    required DateTime expiresAt,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/donations'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'donor_name': donorName,
          'donor_phone': donorPhone,
          'food_type': foodType.toString().split('.').last,
          'quantity_kg': quantityKg,
          'description': description,
          'latitude': latitude,
          'longitude': longitude,
          'address': address,
          'expires_at': expiresAt.toIso8601String(),
        }),
      );

      if (response.statusCode == 201) {
        return Donation.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create donation: ${response.statusCode}');
      }
    } catch (e) {
      _logger.e('Error creating donation: $e');
      rethrow;
    }
  }

  // =========================================================================
  // WEBSOCKET CONNECTION
  // =========================================================================

  /// Connect to WebSocket for real-time updates
  WebSocketChannel connectWebSocket() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse('$wsUrl/ws'));
      _logger.i('WebSocket connected');
      return _channel!;
    } catch (e) {
      _logger.e('WebSocket connection failed: $e');
      rethrow;
    }
  }

  /// Send ping to keep connection alive
  void sendPing() {
    if (_channel != null) {
      _channel!.sink.add(json.encode({'type': 'PING'}));
    }
  }

  /// Close WebSocket connection
  void closeWebSocket() {
    _channel?.sink.close();
    _logger.i('WebSocket closed');
  }

  // =========================================================================
  // HEALTH CHECK
  // =========================================================================

  /// Check if backend is reachable
  Future<bool> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      _logger.e('Health check failed: $e');
      return false;
    }
  }
}
