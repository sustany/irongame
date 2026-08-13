import Foundation
import SwiftData

@Model
final class WorkoutRecord {
    var id: UUID
    var activityName: String
    var startDate: Date
    var endDate: Date
    var avgHeartRate: Double
    var maxHeartRate: Double
    var minHeartRate: Double
    var sampleCount: Int
    var notes: String

    init(
        id: UUID = UUID(),
        activityName: String,
        startDate: Date,
        endDate: Date,
        avgHeartRate: Double = 0,
        maxHeartRate: Double = 0,
        minHeartRate: Double = 0,
        sampleCount: Int = 0,
        notes: String = ""
    ) {
        self.id = id
        self.activityName = activityName
        self.startDate = startDate
        self.endDate = endDate
        self.avgHeartRate = avgHeartRate
        self.maxHeartRate = maxHeartRate
        self.minHeartRate = minHeartRate
        self.sampleCount = sampleCount
        self.notes = notes
    }

    var duration: TimeInterval { endDate.timeIntervalSince(startDate) }

    var durationFormatted: String {
        let total = Int(duration)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }
}
