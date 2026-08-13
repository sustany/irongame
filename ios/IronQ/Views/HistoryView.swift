import SwiftUI
import SwiftData

struct HistoryView: View {
    @Query(sort: \WorkoutRecord.startDate, order: .reverse)
    private var workouts: [WorkoutRecord]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        NavigationStack {
            Group {
                if workouts.isEmpty {
                    ContentUnavailableView(
                        "No workouts yet",
                        systemImage: "figure.strengthtraining.traditional",
                        description: Text("Finished workouts appear here.")
                    )
                } else {
                    List {
                        ForEach(workouts) { workout in
                            NavigationLink(value: workout.id) {
                                WorkoutRow(workout: workout)
                            }
                        }
                        .onDelete(perform: delete)
                    }
                    .navigationDestination(for: UUID.self) { id in
                        if let workout = workouts.first(where: { $0.id == id }) {
                            WorkoutDetailView(workout: workout)
                        }
                    }
                }
            }
            .navigationTitle("History")
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(workouts[index])
        }
    }
}

struct WorkoutRow: View {
    let workout: WorkoutRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(workout.activityName)
                    .font(.headline)
                Spacer()
                Text(workout.durationFormatted)
                    .font(.subheadline)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 12) {
                Text(workout.startDate.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if workout.avgHeartRate > 0 {
                    Label("\(Int(workout.avgHeartRate)) avg", systemImage: "heart.fill")
                        .font(.caption)
                        .foregroundStyle(.red)
                    Text("\(Int(workout.maxHeartRate)) max")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}

struct WorkoutDetailView: View {
    let workout: WorkoutRecord

    var body: some View {
        List {
            Section("Session") {
                row("Activity", workout.activityName)
                row("Start", workout.startDate.formatted(date: .abbreviated, time: .shortened))
                row("End", workout.endDate.formatted(date: .omitted, time: .shortened))
                row("Duration", workout.durationFormatted)
            }
            Section("Heart Rate") {
                if workout.sampleCount > 0 {
                    row("Average", "\(Int(workout.avgHeartRate)) bpm")
                    row("Max", "\(Int(workout.maxHeartRate)) bpm")
                    row("Min", "\(Int(workout.minHeartRate)) bpm")
                    row("Samples", "\(workout.sampleCount)")
                } else {
                    Text("No heart-rate samples were recorded during this session.")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle(workout.activityName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
    }
}
