import SwiftUI
import SwiftData

@main
struct IronQApp: App {
    @StateObject private var health = HealthKitManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(health)
        }
        .modelContainer(for: WorkoutRecord.self)
    }
}
