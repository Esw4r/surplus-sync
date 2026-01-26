// lib/providers/donation_provider.dart

import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:logger/logger.dart';
import '../models/donation.dart';
import '../services/api_service.dart';

// ============================================================================
// API SERVICE PROVIDER
// ============================================================================

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

// ============================================================================
// DONATIONS STATE PROVIDER
// ============================================================================

class DonationsNotifier extends StateNotifier<AsyncValue<List<Donation>>> {
  DonationsNotifier(this.apiService) : super(const AsyncValue.loading()) {
    _init();
  }

  final ApiService apiService;
  final Logger _logger = Logger();
  WebSocketChannel? _wsChannel;
  StreamSubscription? _wsSubscription;

  Future<void> _init() async {
    await fetchDonations();
    _connectWebSocket();
  }

  /// Fetch all available donations
  Future<void> fetchDonations() async {
    state = const AsyncValue.loading();
    try {
      final donations = await apiService.getAvailableDonations();
      state = AsyncValue.data(donations);
      _logger.i('Loaded ${donations.length} donations');
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      _logger.e('Error loading donations: $e');
    }
  }

  /// Connect to WebSocket for real-time updates
  void _connectWebSocket() {
    try {
      _wsChannel = apiService.connectWebSocket();
      
      _wsSubscription = _wsChannel!.stream.listen(
        (message) {
          _handleWebSocketMessage(message);
        },
        onError: (error) {
          _logger.e('WebSocket error: $error');
          // Attempt reconnection after delay
          Future.delayed(const Duration(seconds: 5), () {
            _connectWebSocket();
          });
        },
        onDone: () {
          _logger.w('WebSocket connection closed');
          // Attempt reconnection
          Future.delayed(const Duration(seconds: 5), () {
            _connectWebSocket();
          });
        },
      );

      // Keep connection alive with periodic pings
      Timer.periodic(const Duration(seconds: 30), (timer) {
        if (_wsChannel != null) {
          apiService.sendPing();
        } else {
          timer.cancel();
        }
      });
    } catch (e) {
      _logger.e('Failed to connect WebSocket: $e');
    }
  }

  /// Handle incoming WebSocket messages
  void _handleWebSocketMessage(dynamic message) {
    try {
      final data = json.decode(message);
      final wsMessage = WebSocketMessage.fromJson(data);

      switch (wsMessage.event) {
        case WebSocketEventType.NEW_DONATION:
          _handleNewDonation(wsMessage.data);
          break;
        case WebSocketEventType.STATUS_UPDATE:
          _handleStatusUpdate(wsMessage.data);
          break;
        case WebSocketEventType.PONG:
          // Connection alive confirmation
          break;
      }
    } catch (e) {
      _logger.e('Error parsing WebSocket message: $e');
    }
  }

  /// Add new donation to state
  void _handleNewDonation(Map<String, dynamic> data) {
    state.whenData((donations) {
      // Fetch fresh data to get complete donation object
      fetchDonations();
    });
    _logger.i('New donation received: ${data['id']}');
  }

  /// Update donation status in state
  void _handleStatusUpdate(Map<String, dynamic> data) {
    final donationId = data['id'] as int;
    final newStatus = DonationStatus.values.firstWhere(
      (e) => e.toString().split('.').last == data['status'],
    );

    state.whenData((donations) {
      final updatedDonations = donations.map((donation) {
        if (donation.id == donationId) {
          // If status changed to non-AVAILABLE, remove from list
          if (newStatus != DonationStatus.AVAILABLE) {
            return null;
          }
        }
        return donation;
      }).whereType<Donation>().toList();

      state = AsyncValue.data(updatedDonations);
    });

    _logger.i('Status updated for donation $donationId: $newStatus');
  }

  /// Manual refresh
  Future<void> refresh() async {
    await fetchDonations();
  }

  @override
  void dispose() {
    _wsSubscription?.cancel();
    apiService.closeWebSocket();
    super.dispose();
  }
}

final donationsProvider = StateNotifierProvider<DonationsNotifier, AsyncValue<List<Donation>>>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return DonationsNotifier(apiService);
});

// ============================================================================
// MAP MARKERS PROVIDER (Optimized for map display)
// ============================================================================

final mapMarkersProvider = FutureProvider<List<MapMarker>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getMapMarkers();
});

// ============================================================================
// SELECTED DONATION PROVIDER
// ============================================================================

final selectedDonationProvider = StateProvider<Donation?>((ref) => null);

// ============================================================================
// FILTER PROVIDERS
// ============================================================================

enum DonationFilter {
  all,
  urgent, // < 2 hours
  veg,
  nonVeg,
  vegan,
}

final donationFilterProvider = StateProvider<DonationFilter>((ref) => DonationFilter.all);

final filteredDonationsProvider = Provider<AsyncValue<List<Donation>>>((ref) {
  final donations = ref.watch(donationsProvider);
  final filter = ref.watch(donationFilterProvider);

  return donations.whenData((list) {
    switch (filter) {
      case DonationFilter.urgent:
        return list.where((d) => d.isUrgent).toList();
      case DonationFilter.veg:
        return list.where((d) => d.foodType == FoodType.VEG).toList();
      case DonationFilter.nonVeg:
        return list.where((d) => d.foodType == FoodType.NON_VEG).toList();
      case DonationFilter.vegan:
        return list.where((d) => d.foodType == FoodType.VEGAN).toList();
      case DonationFilter.all:
      default:
        return list;
    }
  });
});
