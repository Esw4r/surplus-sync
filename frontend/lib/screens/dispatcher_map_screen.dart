// lib/screens/dispatcher_map_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../models/donation.dart';
import '../providers/donation_provider.dart';
import '../widgets/donation_details_sheet.dart';
import '../widgets/filter_chips.dart';

class DispatcherMapScreen extends ConsumerStatefulWidget {
  const DispatcherMapScreen({super.key});

  @override
  ConsumerState<DispatcherMapScreen> createState() =>
      _DispatcherMapScreenState();
}

class _DispatcherMapScreenState extends ConsumerState<DispatcherMapScreen> {
  GoogleMapController? _mapController;

  // Default to Chennai, Tamil Nadu
  static const LatLng _defaultCenter = LatLng(13.0827, 80.2707);
  LatLng _currentCenter = _defaultCenter;

  final Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  /// Get dispatcher's current location
  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition();
        setState(() {
          _currentCenter = LatLng(position.latitude, position.longitude);
        });
        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(_currentCenter, 12),
        );
      }
    } catch (e) {
      debugPrint('Error getting location: $e');
    }
  }

  /// Build markers from donations
  void _buildMarkers(List<Donation> donations) {
  _markers.clear();

  for (final donation in donations) {
    // Use emojis for visual distinction on web
    String emoji;
    
    switch (donation.foodType.toString().split('.').last) {
      case 'VEG':
        emoji = '🥗';
        break;
      case 'NON_VEG':
        emoji = '🍗';
        break;
      case 'VEGAN':
        emoji = '🌱';
        break;
      case 'MIXED':
        emoji = '🍱';
        break;
      default:
        emoji = '📍';
    }
    
    _markers.add(
      Marker(
        markerId: MarkerId('donation_${donation.id}'),
        position: LatLng(donation.latitude, donation.longitude),
        icon: BitmapDescriptor.defaultMarker,
        infoWindow: InfoWindow(
          title: '$emoji ${donation.donorName}',
          snippet: '${donation.quantityKg}kg',
        ),
        onTap: () => _onMarkerTapped(donation),
      ),
    );
  }

  setState(() {});
}

  /// Format time remaining
  String _formatTimeLeft(Donation donation) {
    final hours = donation.hoursUntilExpiry;
    if (hours < 0) return 'EXPIRED';
    if (hours < 1) return '${(hours * 60).toInt()}min left';
    return '${hours.toStringAsFixed(1)}h left';
  }

  /// Handle marker tap
  void _onMarkerTapped(Donation donation) {
    ref.read(selectedDonationProvider.notifier).state = donation;
    _showDonationDetails(donation);
  }

  /// Show donation details in bottom sheet
  void _showDonationDetails(Donation donation) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DonationDetailsSheet(donation: donation),
    );
  }

  @override
  Widget build(BuildContext context) {
    final donationsAsync = ref.watch(filteredDonationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dispatcher Dashboard'),
        backgroundColor: Colors.green.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(donationsProvider.notifier).refresh();
            },
          ),
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _getCurrentLocation,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Google Map
          donationsAsync.when(
            data: (donations) {
              // Update markers when data changes
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _buildMarkers(donations);
              });

              return GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: _currentCenter,
                  zoom: 12,
                ),
                markers: _markers,
                myLocationEnabled: false, // Changed to false for web
                myLocationButtonEnabled: false,
                zoomControlsEnabled: true, // Better for web
                mapType: MapType.normal,

                // PERFORMANCE OPTIMIZATIONS
                compassEnabled: false,
                mapToolbarEnabled: false,
                tiltGesturesEnabled: false,
                rotateGesturesEnabled: false,
                buildingsEnabled: false,
                trafficEnabled: false,
                indoorViewEnabled: false,

                // SMOOTH ZOOM
                minMaxZoomPreference: MinMaxZoomPreference(10, 16),

                onMapCreated: (controller) {
                  _mapController = controller;
                },
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(),
            ),
            error: (error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error loading donations: $error'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      ref.read(donationsProvider.notifier).refresh();
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),

          // Filter chips
          const Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: FilterChips(),
          ),

          // Stats card
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: _buildStatsCard(donationsAsync),
          ),
        ],
      ),
    );
  }

  /// Build statistics card
  Widget _buildStatsCard(AsyncValue<List<Donation>> donationsAsync) {
    return donationsAsync.when(
      data: (donations) {
        final urgentCount = donations.where((d) => d.isUrgent).length;
        final totalKg = donations.fold(0.0, (sum, d) => sum + d.quantityKg);

        return Card(
          elevation: 8,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem(
                  icon: Icons.restaurant,
                  label: 'Available',
                  value: '${donations.length}',
                  color: Colors.blue,
                ),
                _buildStatItem(
                  icon: Icons.warning_rounded,
                  label: 'Urgent',
                  value: '$urgentCount',
                  color: Colors.red,
                ),
                _buildStatItem(
                  icon: Icons.scale,
                  label: 'Total',
                  value: '${totalKg.toStringAsFixed(1)} kg',
                  color: Colors.green,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }
}
