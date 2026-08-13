import SwiftUI
import SwiftData

struct WorkoutView: View {
    @EnvironmentObject private var health: HealthKitManager
    @Environment(\.modelContext) private var modelContext

    @State private var activity: ActivityChoice = .strength
    @State private var sessionStart: Date? = nil
    @State private var now = Date()
    @State private var showSavedBanner = false

    private let clock = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var isActive: Bool { sessionStart != nil }

    private var elapsed: String {
        guard let sessionStart else { return "0:00" }
        let total = Int(now.timeIntervalSince(sessionStart))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if !health.healthDataAvailable {
                    ContentUnavailableView(
                        "Health data unavailable",
                        systemImage: "heart.slash",
                        description: Text("This device does not support HealthKit.")
                    )
                } else {
                    heartRateCard
                    statsRow

                    if !isActive {
                        Picker("Activity", selection: $activity) {
                            ForEach(ActivityChoice.allCases) { choice in
                                Label(choice.rawValue, systemImage: choice.symbol)
                                    .tag(choice)
                            }
                        }
                        .pickerStyle(.menu)
                    } else {
                        Label(activity.rawValue, systemImage: activity.symbol)
                            .font(.headline)
                        Text(elapsed)
                            .font(.system(size: 44, weight: .semibold, design: .rounded))
                            .monospacedDigit()
                    }

                    Spacer()

                    Button(action: toggleSession) {
                        Text(isActive ? "End Workout" : "Start Workout")
                            .font(.title3.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(isActive ? .red : .green)
                }
            }
            .padding()
            .navigationTitle("IronQ")
            .onReceive(clock) { now = $0 }
            .overlay(alignment: .top) {
                if showSavedBanner {
                    Text("Workout saved")
                        .font(.subheadline.weight(.medium))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(.green.opacity(0.9), in: Capsule())
                        .foregroundStyle(.white)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
    }

    private var heartRateCard: some View {
        VStack(spacing: 8) {
            Image(systemName: "heart.fill")
                .font(.system(size: 36))
                .foregroundStyle(.red)
                .symbolEffect(.pulse, isActive: isActive && health.latestHeartRate != nil)
            if let hr = health.latestHeartRate {
                Text("\(Int(hr))")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Text("BPM")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let sampleDate = health.latestSampleDate {
                    Text("Updated \(sampleDate.formatted(date: .omitted, time: .standard))")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            } else {
                Text("--")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                Text(isActive
                     ? "Waiting for heart-rate samples.\nStart a workout on your Apple Watch to stream HR."
                     : "Start a workout to stream heart rate")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 20))
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statTile("Avg", value: health.sessionAvg)
            statTile("Max", value: health.sessionMax)
            statTile("Min", value: health.sessionMin)
        }
    }

    private func statTile(_ label: String, value: Double) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value > 0 ? "\(Int(value))" : "--")
                .font(.title2.weight(.semibold))
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 14))
    }

    private func toggleSession() {
        if let start = sessionStart {
            endSession(start: start)
        } else {
            let start = Date()
            sessionStart = start
            health.startHeartRateStream(from: start)
        }
    }

    private func endSession(start: Date) {
        let end = Date()
        health.stopHeartRateStream()

        let record = WorkoutRecord(
            activityName: activity.rawValue,
            startDate: start,
            endDate: end,
            avgHeartRate: health.sessionAvg,
            maxHeartRate: health.sessionMax,
            minHeartRate: health.sessionMin,
            sampleCount: health.sessionSamples.count
        )
        modelContext.insert(record)

        health.saveWorkout(activity: activity.hkType, start: start, end: end) { _ in }

        sessionStart = nil
        withAnimation { showSavedBanner = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { showSavedBanner = false }
        }
    }
}
