import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var health: HealthKitManager

    var body: some View {
        TabView {
            WorkoutView()
                .tabItem { Label("Workout", systemImage: "heart.fill") }
            HistoryView()
                .tabItem { Label("History", systemImage: "list.bullet.rectangle") }
        }
        .onAppear { health.requestAuthorization() }
    }
}
