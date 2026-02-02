// lib/models/user.dart

/// User role enum matching backend
enum UserRole {
  admin,
  dispatcher,
  ngo,
  volunteer,
  donor;

  String get value {
    switch (this) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.dispatcher:
        return 'DISPATCHER';
      case UserRole.ngo:
        return 'NGO';
      case UserRole.volunteer:
        return 'VOLUNTEER';
      case UserRole.donor:
        return 'DONOR';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.dispatcher:
        return 'Dispatcher';
      case UserRole.ngo:
        return 'NGO';
      case UserRole.volunteer:
        return 'Volunteer';
      case UserRole.donor:
        return 'Donor';
    }
  }

  static UserRole fromString(String value) {
    switch (value.toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'DISPATCHER':
        return UserRole.dispatcher;
      case 'NGO':
        return UserRole.ngo;
      case 'VOLUNTEER':
        return UserRole.volunteer;
      case 'DONOR':
        return UserRole.donor;
      default:
        return UserRole.volunteer;
    }
  }
}

/// User model
class User {
  final int id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final int isVerified;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.isVerified,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      role: UserRole.fromString(json['role']),
      isVerified: json['is_verified'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.value,
      'is_verified': isVerified,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Auth token response
class AuthToken {
  final String accessToken;
  final String tokenType;
  final User user;

  AuthToken({
    required this.accessToken,
    required this.tokenType,
    required this.user,
  });

  factory AuthToken.fromJson(Map<String, dynamic> json) {
    return AuthToken(
      accessToken: json['access_token'],
      tokenType: json['token_type'],
      user: User.fromJson(json['user']),
    );
  }
}
