import Foundation
import HealthKit

/// Central HealthKit interface: authorization, live heart-rate streaming,
/// and saving finished workouts back to the Health store.
final class HealthKitManager: ObservableObject {

    // MARK: Published state

    @Published var isAuthorized = false
    @Published var latestHeartRate: Double? = nil
    @Published var latestSampleDate: Date? = nil
    @Published var sessionSamples: [Double] = []

    // MARK: Private

    private let healthStore = HKHealthStore()
    private var liveQuery: HKAnchoredObjectQuery?
    private var sessionStart: Date?

    private var heartRateType: HKQuantityType {
        HKQuantityType.quantityType(forIdentifier: .heartRate)!
    }

    private let bpmUnit = HKUnit.count().unitDivided(by: HKUnit.minute())

    // MARK: Authorization

    var healthDataAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestAuthorization() {
        guard healthDataAvailable else { return }
        let read: Set<HKObjectType> = [heartRateType, HKObjectType.workoutType()]
        let share: Set<HKSampleType> = [HKObjectType.workoutType()]
        healthStore.requestAuthorization(toShare: share, read: read) { [weak self] success, _ in
            DispatchQueue.main.async {
                self?.isAuthorized = success
            }
        }
    }

    // MARK: Live heart-rate streaming

    /// Streams heart-rate samples written to HealthKit from `start` onward
    /// (Apple Watch is the usual source). Updates arrive while the app is
    /// in the foreground.
    func startHeartRateStream(from start: Date) {
        stopHeartRateStream()
        sessionStart = start
        sessionSamples = []
        latestHeartRate = nil
        latestSampleDate = nil

        let predicate = HKQuery.predicateForSamples(
            withStart: start, end: nil, options: .strictStartDate
        )

        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            self?.ingest(samples)
        }
        query.updateHandler = { [weak self] _, samples, _, _, _ in
            self?.ingest(samples)
        }

        healthStore.execute(query)
        liveQuery = query
    }

    func stopHeartRateStream() {
        if let liveQuery { healthStore.stop(liveQuery) }
        liveQuery = nil
    }

    private func ingest(_ samples: [HKSample]?) {
        guard let quantitySamples = samples as? [HKQuantitySample],
              !quantitySamples.isEmpty else { return }
        let values = quantitySamples
            .sorted { $0.startDate < $1.startDate }
            .map { $0.quantity.doubleValue(for: bpmUnit) }
        let newest = quantitySamples.map(\.startDate).max()
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.sessionSamples.append(contentsOf: values)
            if let last = values.last { self.latestHeartRate = last }
            if let newest { self.latestSampleDate = newest }
        }
    }

    // MARK: Session stats

    var sessionAvg: Double {
        guard !sessionSamples.isEmpty else { return 0 }
        return sessionSamples.reduce(0, +) / Double(sessionSamples.count)
    }
    var sessionMax: Double { sessionSamples.max() ?? 0 }
    var sessionMin: Double { sessionSamples.min() ?? 0 }

    // MARK: Saving workouts to Health

    func saveWorkout(
        activity: HKWorkoutActivityType,
        start: Date,
        end: Date,
        completion: @escaping (Bool) -> Void
    ) {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activity

        let builder = HKWorkoutBuilder(
            healthStore: healthStore, configuration: configuration, device: .local()
        )

        builder.beginCollection(withStart: start) { [weak self] began, _ in
            guard began, self != nil else {
                DispatchQueue.main.async { completion(false) }
                return
            }
            builder.endCollection(withEnd: end) { ended, _ in
                guard ended else {
                    DispatchQueue.main.async { completion(false) }
                    return
                }
                builder.finishWorkout { workout, _ in
                    DispatchQueue.main.async { completion(workout != nil) }
                }
            }
        }
    }
}

// MARK: - Activity choices for the alpha

enum ActivityChoice: String, CaseIterable, Identifiable {
    case strength = "Strength"
    case functional = "Functional"
    case hiit = "HIIT"
    case running = "Running"
    case walking = "Walking"
    case cycling = "Cycling"
    case other = "Other"

    var id: String { rawValue }

    var hkType: HKWorkoutActivityType {
        switch self {
        case .strength: return .traditionalStrengthTraining
        case .functional: return .functionalStrengthTraining
        case .hiit: return .highIntensityIntervalTraining
        case .running: return .running
        case .walking: return .walking
        case .cycling: return .cycling
        case .other: return .other
        }
    }

    var symbol: String {
        switch self {
        case .strength: return "dumbbell.fill"
        case .functional: return "figure.strengthtraining.functional"
        case .hiit: return "flame.fill"
        case .running: return "figure.run"
        case .walking: return "figure.walk"
        case .cycling: return "bicycle"
        case .other: return "sparkles"
        }
    }
}
