// lib/widgets/filter_chips.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/donation_provider.dart';

class FilterChips extends ConsumerWidget {
  const FilterChips({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedFilter = ref.watch(donationFilterProvider);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip(
                context,
                ref,
                label: 'All',
                icon: Icons.list,
                filter: DonationFilter.all,
                isSelected: selectedFilter == DonationFilter.all,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                context,
                ref,
                label: 'Urgent',
                icon: Icons.warning_rounded,
                filter: DonationFilter.urgent,
                isSelected: selectedFilter == DonationFilter.urgent,
                color: Colors.red,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                context,
                ref,
                label: 'Veg',
                icon: Icons.eco,
                filter: DonationFilter.veg,
                isSelected: selectedFilter == DonationFilter.veg,
                color: Colors.green,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                context,
                ref,
                label: 'Non-Veg',
                icon: Icons.restaurant,
                filter: DonationFilter.nonVeg,
                isSelected: selectedFilter == DonationFilter.nonVeg,
                color: Colors.orange,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                context,
                ref,
                label: 'Vegan',
                icon: Icons.local_florist,
                filter: DonationFilter.vegan,
                isSelected: selectedFilter == DonationFilter.vegan,
                color: Colors.amber,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    WidgetRef ref, {
    required String label,
    required IconData icon,
    required DonationFilter filter,
    required bool isSelected,
    Color? color,
  }) {
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected ? Colors.white : (color ?? Colors.grey.shade700),
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        ref.read(donationFilterProvider.notifier).state = filter;
      },
      selectedColor: color ?? Colors.blue,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}
