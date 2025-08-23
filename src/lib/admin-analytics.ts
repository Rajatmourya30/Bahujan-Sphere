import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalStores: number;
  totalOrganizations: number;
  totalReadingRoomDocs: number;
  totalDonations: number;
  averageDonation: number;
  pendingSubmissions: number;
}

export interface UserGrowthData {
  month: string;
  users: number;
}

export interface DonationData {
  month: string;
  donations: number;
}

export interface EventData {
  month: string;
  events: number;
}

// Get basic dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get active users (users who have logged in within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('lastLoginAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;

    // Get total events
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const totalEvents = eventsSnapshot.size;

    // Get total approved stores
    const storesQuery = query(collection(db, 'stores'), where('status', '==', 'approved'));
    const storesSnapshot = await getDocs(storesQuery);
    const totalStores = storesSnapshot.size;

    // Get total approved organizations
    const orgsQuery = query(collection(db, 'organizations'), where('status', '==', 'approved'));
    const orgsSnapshot = await getDocs(orgsQuery);
    const totalOrganizations = orgsSnapshot.size;

    // Get total reading room documents
    const readingRoomSnapshot = await getDocs(collection(db, 'readingRoomPdfs'));
    const totalReadingRoomDocs = readingRoomSnapshot.size;

    // Get donations data
    const donationsSnapshot = await getDocs(collection(db, 'donations'));
    let totalDonations = 0;
    let donationCount = 0;
    
    donationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.amount && typeof data.amount === 'number') {
        totalDonations += data.amount;
        donationCount++;
      }
    });

    const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;

    // Get pending submissions across all types
    const pendingEventsQuery = query(collection(db, 'eventSubmissions'), where('status', '==', 'pending'));
    const pendingStoresQuery = query(collection(db, 'storeSubmissions'), where('status', '==', 'pending'));
    const pendingOrgsQuery = query(collection(db, 'organizationSubmissions'), where('status', '==', 'pending'));
    const pendingReadingRoomQuery = query(collection(db, 'readingRoomSubmissions'), where('status', '==', 'pending'));

    const [pendingEvents, pendingStores, pendingOrgs, pendingReadingRoom] = await Promise.all([
      getDocs(pendingEventsQuery),
      getDocs(pendingStoresQuery),
      getDocs(pendingOrgsQuery),
      getDocs(pendingReadingRoomQuery)
    ]);

    const pendingSubmissions = pendingEvents.size + pendingStores.size + pendingOrgs.size + pendingReadingRoom.size;

    return {
      totalUsers,
      activeUsers,
      totalEvents,
      totalStores,
      totalOrganizations,
      totalReadingRoomDocs,
      totalDonations,
      averageDonation,
      pendingSubmissions
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Get user growth data for the last 12 months
export async function getUserGrowthData(): Promise<UserGrowthData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    // Group users by month for the last 12 months
    const monthlyData: { [key: string]: number } = {};
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize last 12 months with 0
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }

    // Count users by month
    users.forEach(user => {
      const createdAt = user.createdAt;
      const monthKey = `${months[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return Object.entries(monthlyData).map(([month, users]) => ({
      month: month.split(' ')[0], // Just the month name
      users
    }));
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return [];
  }
}

// Get donations data for the last 12 months
export async function getDonationsData(): Promise<DonationData[]> {
  try {
    const donationsSnapshot = await getDocs(collection(db, 'donations'));
    const donations = donationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      amount: doc.data().amount || 0
    }));

    // Group donations by month for the last 12 months
    const monthlyData: { [key: string]: number } = {};
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize last 12 months with 0
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }

    // Sum donations by month
    donations.forEach(donation => {
      const createdAt = donation.createdAt;
      const monthKey = `${months[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += donation.amount;
      }
    });

    return Object.entries(monthlyData).map(([month, donations]) => ({
      month: month.split(' ')[0], // Just the month name
      donations
    }));
  } catch (error) {
    console.error('Error fetching donations data:', error);
    return [];
  }
}

// Get events data for the last 12 months
export async function getEventsData(): Promise<EventData[]> {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    // Group events by month for the last 12 months
    const monthlyData: { [key: string]: number } = {};
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize last 12 months with 0
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }

    // Count events by month
    events.forEach(event => {
      const createdAt = event.createdAt;
      const monthKey = `${months[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return Object.entries(monthlyData).map(([month, events]) => ({
      month: month.split(' ')[0], // Just the month name
      events
    }));
  } catch (error) {
    console.error('Error fetching events data:', error);
    return [];
  }
}

// Get top events by views (if view tracking is implemented)
export async function getTopEvents(limitCount: number = 10) {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('views', 'desc'),
      limit(limitCount)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching top events:', error);
    // If views field doesn't exist, just get recent events
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      views: Math.floor(Math.random() * 1000) // Placeholder until view tracking is implemented
    }));
  }
}

// Get top stores by clicks (if click tracking is implemented)
export async function getTopStores(limitCount: number = 10) {
  try {
    const storesQuery = query(
      collection(db, 'stores'),
      where('status', '==', 'approved'),
      orderBy('clicks', 'desc'),
      limit(limitCount)
    );
    const storesSnapshot = await getDocs(storesQuery);
    return storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching top stores:', error);
    // If clicks field doesn't exist, just get recent stores
    const storesQuery = query(
      collection(db, 'stores'),
      where('status', '==', 'approved'),
      limit(limitCount)
    );
    const storesSnapshot = await getDocs(storesQuery);
    return storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      clicks: Math.floor(Math.random() * 500) // Placeholder until click tracking is implemented
    }));
  }
}

// Get top organizations by views (if view tracking is implemented)
export async function getTopOrganizations(limitCount: number = 10) {
  try {
    const orgsQuery = query(
      collection(db, 'organizations'),
      where('status', '==', 'approved'),
      orderBy('views', 'desc'),
      limit(limitCount)
    );
    const orgsSnapshot = await getDocs(orgsQuery);
    return orgsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching top organizations:', error);
    // If views field doesn't exist, just get recent organizations
    const orgsQuery = query(
      collection(db, 'organizations'),
      where('status', '==', 'approved'),
      limit(limitCount)
    );
    const orgsSnapshot = await getDocs(orgsQuery);
    return orgsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      views: Math.floor(Math.random() * 800) // Placeholder until view tracking is implemented
    }));
  }
}
