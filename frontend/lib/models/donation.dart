// lib/models/donation.dart

/// Represents a food donation listing in the system
class Donation {
  final int id;
  final String donorName;
  final FoodType foodType;
  final double quantityKg;
  final String? description;
  final double latitude;
  final double longitude;
  final String address;
  final DonationStatus status;
  final DateTime createdAt;
  final DateTime expiresAt;
  final int? assignedVolunteerId;

  Donation({
    required this.id,
    required this.donorName,
    required this.foodType,
    required this.quantityKg,
    this.description,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.status,
    required this.createdAt,
    required this.expiresAt,
    this.assignedVolunteerId,
  });

  /// Create Donation from JSON
  factory Donation.fromJson(Map<String, dynamic> json) {
    return Donation(
      id: json['id'],
      donorName: json['donor_name'],
      foodType: FoodType.values.firstWhere(
        (e) => e.toString().split('.').last == json['food_type'],
      ),
      quantityKg: (json['quantity_kg'] as num).toDouble(),
      description: json['description'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'],
      status: DonationStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'],
      ),
      createdAt: DateTime.parse(json['created_at']),
      expiresAt: DateTime.parse(json['expires_at']),
      assignedVolunteerId: json['assigned_volunteer_id'],
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'donor_name': donorName,
      'food_type': foodType.toString().split('.').last,
      'quantity_kg': quantityKg,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'status': status.toString().split('.').last,
      'created_at': createdAt.toIso8601String(),
      'expires_at': expiresAt.toIso8601String(),
      'assigned_volunteer_id': assignedVolunteerId,
    };
  }

  /// Calculate hours until expiry
  /// Calculate hours until expiry
  double get hoursUntilExpiry {
  // Backend already calculates this in UTC, so use that if available
  // Otherwise fall back to local calculation
  final now = DateTime.now().toUtc();
  final expiryUtc = expiresAt.toUtc();
  final difference = expiryUtc.difference(now);
  return difference.inMinutes / 60.0;
}

  /// Check if donation is urgent (expires in < 2 hours)
  bool get isUrgent => hoursUntilExpiry < 2;

  /// Check if donation is expired
  bool get isExpired => hoursUntilExpiry < 0;
}

/// Food type categories
enum FoodType {
  VEG,
  NON_VEG,
  VEGAN,
  MIXED,
}

/// Donation lifecycle status
enum DonationStatus {
  AVAILABLE,
  ASSIGNED,
  IN_TRANSIT,
  DELIVERED,
  CANCELLED,
}

/// Lightweight model for map markers
class MapMarker {
  final int id;
  final double latitude;
  final double longitude;
  final FoodType foodType;
  final double quantityKg;
  final DonationStatus status;
  final String donorName;
  final DateTime expiresAt;
  final double timeUntilExpiryHours;

  MapMarker({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.foodType,
    required this.quantityKg,
    required this.status,
    required this.donorName,
    required this.expiresAt,
    required this.timeUntilExpiryHours,
  });

  factory MapMarker.fromJson(Map<String, dynamic> json) {
    return MapMarker(
      id: json['id'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      foodType: FoodType.values.firstWhere(
        (e) => e.toString().split('.').last == json['food_type'],
      ),
      quantityKg: (json['quantity_kg'] as num).toDouble(),
      status: DonationStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'],
      ),
      donorName: json['donor_name'],
      expiresAt: DateTime.parse(json['expires_at']),
      timeUntilExpiryHours: (json['time_until_expiry_hours'] as num).toDouble(),
    );
  }

  /// Check if marker should show urgent indicator
  bool get isUrgent => timeUntilExpiryHours < 2;
}

/// WebSocket event types
enum WebSocketEventType {
  NEW_DONATION,
  STATUS_UPDATE,
  PONG,
}

/// WebSocket message wrapper
class WebSocketMessage {
  final WebSocketEventType event;
  final Map<String, dynamic> data;

  WebSocketMessage({
    required this.event,
    required this.data,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) {
    return WebSocketMessage(
      event: WebSocketEventType.values.firstWhere(
        (e) => e.toString().split('.').last == json['event'],
      ),
      data: json['data'] ?? {},
    );
  }
}
