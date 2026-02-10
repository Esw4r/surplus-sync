import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../main.dart';
import 'create_donation_screen.dart';
import 'donation_history_screen.dart';

class DonorHomeScreen extends ConsumerStatefulWidget {
  const DonorHomeScreen({super.key});

  @override
  ConsumerState<DonorHomeScreen> createState() => _DonorHomeScreenState();
}

class _DonorHomeScreenState extends ConsumerState<DonorHomeScreen> {
  int _currentIndex = 0;
  Map<String, dynamic>? _donorProfile;
  bool _isLoading = true;

  Key _refreshKey = UniqueKey();

  @override
  void initState() {
    super.initState();
    _loadDonorProfile();
  }

  Future<void> _loadDonorProfile() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final profile = await apiService.getDonorProfile();
      setState(() {
        _donorProfile = profile;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading donor profile: $e'); // Add debug log
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profile: $e')),
        );
      }
    }
  }

  Future<void> _logout() async {
    final apiService = ref.read(apiServiceProvider);
    await apiService.clearToken();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Food Rescue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _currentIndex == 0
          ? _buildDashboard()
          : DonationHistoryScreen(key: _refreshKey),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CreateDonationScreen(),
                  ),
                ).then((_) {
                  _loadDonorProfile();
                  // Force history refresh if we are on history tab or going to it
                  setState(() {
                    _refreshKey = UniqueKey();
                  });
                });
              },
              icon: const Icon(Icons.add),
              label: const Text('New Donation'),
              backgroundColor: const Color(0xFF4CAF50),
              foregroundColor: Colors.white,
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: const Color(0xFF4CAF50),
        items: const [
          BottomNavigationBarItem(
             icon: Icon(Icons.home),
             label: 'Home',
          ),
          BottomNavigationBarItem(
             icon: Icon(Icons.history),
             label: 'History',
          ),
        ],
      ),
    );
  }


  Widget _buildDashboard() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4CAF50), Color(0xFF66BB6A)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.volunteer_activism, size: 40, color: Colors.white),
                const SizedBox(height: 16),
                Text(
                  'Hello, ${_donorProfile?['organization_name'] ?? 'Donor'}!',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Total Donations: ${_donorProfile?['total_donations'] ?? 0}',
                  style: const TextStyle(fontSize: 16, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Quick Stats
          const Text(
            'Quick Stats',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.food_bank,
                  title: 'Donations',
                  value: '${_donorProfile?['total_donations'] ?? 0}',
                  color: const Color(0xFF4CAF50),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  icon: Icons.star,
                  title: 'Rating',
                  value: '${(_donorProfile?['rating'] ?? 5.0).toStringAsFixed(1)}',
                  color: const Color(0xFFFFC107),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // How it works
          const Text(
            'How to Donate',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _HowItWorksStep(
            number: '1',
            title: 'Create Donation',
            description: 'Tap + button to add food details',
          ),
          _HowItWorksStep(
            number: '2',
            title: 'Wait for Pickup',
            description: 'A volunteer will be assigned',
          ),
          _HowItWorksStep(
            number: '3',
            title: 'QR Verification',
            description: 'Volunteer scans QR to confirm pickup',
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

class _HowItWorksStep extends StatelessWidget {
  final String number;
  final String title;
  final String description;

  const _HowItWorksStep({
    required this.number,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
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
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  description,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
