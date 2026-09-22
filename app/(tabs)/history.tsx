import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  type AttendanceRecord,
} from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';
import {
  getTeacherEventAttendance,
  type TeacherEventAttendance,
} from '@/lib/attendance';

export default function HistoryScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<
    TeacherEventAttendance[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';

    setRole(currentRole);

    if (currentRole === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);

      setTeacherEvents(events);
      setRecords([]);
    } else {
      const rows = await getAttendanceHistory(user.id);

      setRecords(rows);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>
            No events yet. Create an event from the Teacher tab.
          </Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{item.title}</Text>

                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {item.attendeeCount}
                    </Text>
                  </View>
                </View>

                <Text style={styles.eventMeta}>
                  {item.eventCode}
                </Text>

                {item.startTime && (
                  <Text style={styles.eventMeta}>
                    Starts: {formatDate(item.startTime)}
                  </Text>
                )}

                {item.attendees.length === 0 ? (
                  <Text style={styles.noAttendees}>
                    No students have scanned this event yet.
                  </Text>
                ) : (
                  <View style={styles.attendeeList}>
                    <Text style={styles.attendeeHeading}>
                      Students
                    </Text>

                    {item.attendees.map((attendee) => (
                      <View
                        key={`${item.eventId}-${attendee.studentId}-${attendee.scannedAt}`}
                        style={styles.attendeeRow}
                      >
                        <Text style={styles.studentId}>
                          {shortId(attendee.studentId)}
                        </Text>

                        <Text style={styles.eventMeta}>
                          {formatDate(attendee.scannedAt)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )
      ) : records.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.eventMeta}>
                {formatDate(item.scannedAt)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#DFF5E1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    flex: 1,
    marginRight: 12,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  attendeeList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attendeeHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  attendeeRow: {
    marginBottom: 8,
  },
  studentId: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  noAttendees: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});