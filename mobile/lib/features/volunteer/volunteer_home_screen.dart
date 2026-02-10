import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../main.dart';
import '../../services/location_service.dart';
import 'route_screen.dart';

class VolunteerHomeScreen extends ConsumerStatefulWidget {
  const VolunteerHomeScreen({super.key});

  @override
  ConsumerState<VolunteerHomeScreen> createState() => _VolunteerHomeScreenState();
}

class _VolunteerHomeScreenState extends ConsumerState<VolunteerHomeScreen> {
  final LocationService _locationService = LocationService();
  
  bool _isOnline = false;
  bool _isLoading = false;
  bool _hasTask = false;
  Map<String, dynamic>? _currentTask;
  Map<String, dynamic>? _volunteerProfile;
  Position? _currentPosition;
  Timer? _taskPollingTimer;
  Timer? _locationUpdateTimer;

  @override
  void initState() {
    super.initState();
    _loadVolunteerProfile();
  }

  @override
  void dispose() {
    _taskPollingTimer?.cancel();
    _locationUpdateTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadVolunteerProfile() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final profile = await apiService.getVolunteerProfile();
      setState(() {
        _volunteerProfile = profile;
      });
    } catch (e) {
      // Profile may not exist yet
    }
  }

  Future<void> _toggleOnlineStatus() async {
    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);

      if (_isOnline) {
        // Going offline
        await apiService.goOffline();
        _taskPollingTimer?.cancel();
        _locationUpdateTimer?.cancel();
        setState(() {
          _isOnline = false;
          _currentTask = null;
          _hasTask = false;
        });
      } else {
        // Going online - need location first
        final position = await _locationService.getCurrentPosition();
        if (position == null) {
          throw Exception('Location not available');
        }

        await apiService.goOnline(position.latitude, position.longitude);
        setState(() {
          _isOnline = true;
          _currentPosition = position;
        });

        // Start polling for tasks
        _startTaskPolling();
        _startLocationUpdates();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _startTaskPolling() {
    _taskPollingTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!_isOnline || _hasTask) return;

      try {
        final apiService = ref.read(apiServiceProvider);
        final task = await apiService.getCurrentTask();
        
        if (task != null && mounted) {
          setState(() {
            _currentTask = task;
            _hasTask = true;
          });
        }
      } catch (e) {
        // Ignore errors during polling
      }
    });
  }

  void _startLocationUpdates() {
    _locationUpdateTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      if (!_isOnline) return;

      try {
        final position = await _locationService.getCurrentPosition();
        if (position != null) {
          final apiService = ref.read(apiServiceProvider);
          await apiService.updateLocation(position.latitude, position.longitude);
          setState(() {
            _currentPosition = position;
          });
        }
      } catch (e) {
        // Ignore errors during location updates
      }
    });
  }

  Future<void> _acceptTask() async {
    if (_currentTask == null) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.acceptTask(_currentTask!['id']);

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RouteScreen(task: _currentTask!),
          ),
        ).then((_) {
          // Reset after returning from route
          setState(() {
            _currentTask = null;
            _hasTask = false;
          });
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to accept task: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _logout() async {
    if (_isOnline) {
      await ref.read(apiServiceProvider).goOffline();
    }
    await ref.read(apiServiceProvider).clearToken();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Volunteer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status Card
              _buildStatusCard(),
              const SizedBox(height: 24),

              // Task Card (if assigned)
              if (_hasTask && _currentTask != null) _buildTaskCard(),

              // Waiting message
              if (_isOnline && !_hasTask) _buildWaitingCard(),

              // Stats (when offline)
              if (!_isOnline) _buildOfflineContent(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _isOnline
              ? [const Color(0xFF4CAF50), const Color(0xFF66BB6A)]
              : [Colors.grey.shade400, Colors.grey.shade500],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isOnline ? 'You are Online' : 'You are Offline',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _isOnline ? 'Waiting for tasks...' : 'Go online to receive tasks',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
              Icon(
                _isOnline ? Icons.signal_wifi_4_bar : Icons.signal_wifi_off,
                size: 40,
                color: Colors.white,
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Toggle Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _toggleOnlineStatus,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: _isOnline ? Colors.red : const Color(0xFF4CAF50),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      _isOnline ? 'Go Offline' : 'Go Online',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.notifications_active, color: Colors.orange.shade700),
              const SizedBox(width: 8),
              Text(
                'New Task Available!',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTaskDetail(Icons.restaurant, 'Food Type', _currentTask!['food_type'] ?? 'Mixed'),
          _buildTaskDetail(Icons.scale, 'Quantity', '${_currentTask!['quantity_kg'] ?? 0} kg'),
          if (_currentTask!['requires_cooling'] == true)
            _buildTaskDetail(Icons.ac_unit, 'Cooling', 'Required'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _acceptTask,
              icon: const Icon(Icons.check),
              label: const Text('Accept Task'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskDetail(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildWaitingCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(Icons.hourglass_empty, size: 48, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            'Waiting for tasks...',
            style: TextStyle(fontSize: 18, color: Colors.grey[700]),
          ),
          const SizedBox(height: 8),
          Text(
            'Stay in the app to receive tasks',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildOfflineContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'How it works',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        _buildStep('1', 'Go Online', 'Enable location and start receiving tasks'),
        _buildStep('2', 'Accept Task', 'Review and accept food pickup tasks'),
        _buildStep('3', 'Navigate', 'Use maps to reach pickup location'),
        _buildStep('4', 'Scan QR', 'Verify pickup and delivery with QR codes'),
      ],
    );
  }

  Widget _buildStep(String number, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(description, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
