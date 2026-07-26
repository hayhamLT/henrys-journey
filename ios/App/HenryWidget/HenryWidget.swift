// HenryWidget — Home Screen and Lock Screen widgets for Henry's Journey.
//
// Small widget: Streak count + savings goal ring.
// Medium widget: Adds "Continue Level" nudge with world name.
//
// State comes from a shared App Group UserDefaults suite
// (group.com.henrysjourney.app.shared) — the web app writes there whenever
// it saves progress, using the Capacitor Preferences plugin with
// `group: 'group.com.henrysjourney.app.shared'`.

import WidgetKit
import SwiftUI

// MARK: - Shared UserDefaults

private let sharedSuite = "group.com.henrysjourney.app.shared"

struct HenryState {
    let streak: Int
    let savingsCurrent: Int
    let savingsGoal: Int
    let currentLevel: Int
    let worldName: String

    static let placeholder = HenryState(
        streak: 3, savingsCurrent: 312, savingsGoal: 500,
        currentLevel: 4, worldName: "The Meadow"
    )

    static func load() -> HenryState {
        let d = UserDefaults(suiteName: sharedSuite)
        return HenryState(
            streak: d?.integer(forKey: "streak") ?? 0,
            savingsCurrent: d?.integer(forKey: "savingsCurrent") ?? 0,
            savingsGoal: max(1, d?.integer(forKey: "savingsGoal") ?? 200),
            currentLevel: d?.integer(forKey: "currentLevel") ?? 1,
            worldName: d?.string(forKey: "worldName") ?? "The Meadow"
        )
    }
}

// MARK: - Timeline

struct HenryEntry: TimelineEntry {
    let date: Date
    let state: HenryState
}

struct HenryProvider: TimelineProvider {
    func placeholder(in context: Context) -> HenryEntry {
        HenryEntry(date: Date(), state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (HenryEntry) -> Void) {
        completion(HenryEntry(date: Date(), state: HenryState.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HenryEntry>) -> Void) {
        // Refresh every 30 minutes.
        let entry = HenryEntry(date: Date(), state: HenryState.load())
        let next = Date().addingTimeInterval(30 * 60)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Views

/// Circular ring showing % progress toward the savings goal.
struct SavingsRing: View {
    let current: Int
    let goal: Int

    var body: some View {
        let pct = min(1.0, Double(current) / Double(goal))
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 8)
            Circle()
                .trim(from: 0, to: pct)
                .stroke(
                    LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom),
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(Int(pct * 100))%")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Text("saved")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
    }
}

struct SmallHenryView: View {
    let state: HenryState
    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.12, green: 0.16, blue: 0.24),
                                    Color(red: 0.06, green: 0.09, blue: 0.16)],
                           startPoint: .top, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Text("🔥")
                    Text("\(state.streak)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text("day streak")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.55))
                    Spacer()
                }
                Spacer()
                HStack {
                    SavingsRing(current: state.savingsCurrent, goal: state.savingsGoal)
                        .frame(width: 64, height: 64)
                    Spacer()
                }
            }
            .padding(14)
        }
    }
}

struct MediumHenryView: View {
    let state: HenryState
    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.12, green: 0.16, blue: 0.24),
                                    Color(red: 0.06, green: 0.09, blue: 0.16)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            HStack(spacing: 12) {
                SavingsRing(current: state.savingsCurrent, goal: state.savingsGoal)
                    .frame(width: 84, height: 84)
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Text("🔥")
                        Text("\(state.streak) day streak")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text("$\(state.savingsCurrent) / $\(state.savingsGoal)")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundStyle(.yellow)
                    Divider().background(.white.opacity(0.2))
                    Text("Continue: \(state.worldName)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.75))
                        .lineLimit(1)
                    Text("Level \(state.currentLevel)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                }
                Spacer()
            }
            .padding(14)
        }
    }
}

// MARK: - Widget declaration

struct HenryWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: HenryEntry

    var body: some View {
        switch family {
        case .systemMedium: MediumHenryView(state: entry.state)
        default:            SmallHenryView(state: entry.state)
        }
    }
}

@main
struct HenryWidget: Widget {
    let kind: String = "HenryWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HenryProvider()) { entry in
            if #available(iOS 17.0, *) {
                HenryWidgetEntryView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                HenryWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Henry's Streak")
        .description("Track your daily streak and savings goal.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
