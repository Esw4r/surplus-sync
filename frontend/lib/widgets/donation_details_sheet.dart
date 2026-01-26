// lib/widgets/donation_details_sheet.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/donation.dart';

class DonationDetailsSheet extends StatelessWidget {
  final Donation donation;

  const DonationDetailsSheet({
    super.key,
    required this.donation,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Header with urgency indicator
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          donation.donorName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (donation.isUrgent)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.warning, color: Colors.white, size: 16),
                              SizedBox(width: 4),
                              Text(
                                'URGENT',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Status badge
                  _buildStatusBadge(),
                  const SizedBox(height: 24),

                  // Key information
                  _buildInfoRow(
                    icon: Icons.restaurant,
                    label: 'Food Type',
                    value: _getFoodTypeText(),
                    color: _getFoodTypeColor(),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    icon: Icons.scale,
                    label: 'Quantity',
                    value: '${donation.quantityKg} kg',
                    color: Colors.blue,
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    icon: Icons.access_time,
                    label: 'Time Until Expiry',
                    value: _formatTimeLeft(),
                    color: donation.isUrgent ? Colors.red : Colors.green,
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    icon: Icons.schedule,
                    label: 'Expires At',
                    value: DateFormat('MMM dd, hh:mm a').format(donation.expiresAt),
                    color: Colors.grey,
                  ),

                  // Description
                  if (donation.description != null) ...[
                    const SizedBox(height: 24),
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        donation.description!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],

                  // Address
                  const SizedBox(height: 24),
                  const Text(
                    'Pickup Address',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.blue.shade700),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            donation.address,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.blue.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Action buttons
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            // TODO: Implement directions
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Directions feature coming in S2!'),
                              ),
                            );
                          },
                          icon: const Icon(Icons.directions),
                          label: const Text('Directions'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            // TODO: Implement volunteer assignment
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Volunteer assignment coming in S12!'),
                              ),
                            );
                          },
                          icon: const Icon(Icons.person_add),
                          label: const Text('Assign'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green.shade700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    IconData icon;

    switch (donation.status) {
      case DonationStatus.AVAILABLE:
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case DonationStatus.ASSIGNED:
        color = Colors.blue;
        icon = Icons.person;
        break;
      case DonationStatus.IN_TRANSIT:
        color = Colors.orange;
        icon = Icons.local_shipping;
        break;
      case DonationStatus.DELIVERED:
        color = Colors.purple;
        icon = Icons.done_all;
        break;
      case DonationStatus.CANCELLED:
        color = Colors.red;
        icon = Icons.cancel;
        break;
    }

    return Chip(
      avatar: Icon(icon, color: Colors.white, size: 18),
      label: Text(
        donation.status.toString().split('.').last,
        style: const TextStyle(color: Colors.white),
      ),
      backgroundColor: color,
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getFoodTypeText() {
    switch (donation.foodType) {
      case FoodType.VEG:
        return 'Vegetarian';
      case FoodType.NON_VEG:
        return 'Non-Vegetarian';
      case FoodType.VEGAN:
        return 'Vegan';
      case FoodType.MIXED:
        return 'Mixed';
    }
  }

  Color _getFoodTypeColor() {
    switch (donation.foodType) {
      case FoodType.VEG:
        return Colors.green;
      case FoodType.NON_VEG:
        return Colors.orange;
      case FoodType.VEGAN:
        return Colors.amber;
      case FoodType.MIXED:
        return Colors.blue;
    }
  }

  String _formatTimeLeft() {
    final hours = donation.hoursUntilExpiry;
    if (hours < 0) return 'EXPIRED';
    if (hours < 1) return '${(hours * 60).toInt()} minutes';
    if (hours < 24) return '${hours.toStringAsFixed(1)} hours';
    return '${(hours / 24).toStringAsFixed(1)} days';
  }
}
