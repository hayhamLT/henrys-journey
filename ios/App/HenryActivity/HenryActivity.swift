// Live Activity for the currently-active level.
// Shows on the Lock Screen and inside the Dynamic Island while a level is in
// progress. iOS 16.1+ only.
//
// The web app starts / updates / ends the activity via a small Capacitor
// plugin bridge (see HenryActivityPlugin.swift).

import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
public struct HenryActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var coinsCollected: Int
        public var coinsTarget: Int
        public var movesUsed: Int
        public var movesBudget: Int
        public var levelName: String
        public var worldName: String

        public init(coinsCollected: Int, coinsTarget: Int, movesUsed: Int, movesBudget: Int, levelName: String, worldName: String) {
            self.coinsCollected = coinsCollected
            self.coinsTarget = coinsTarget
            self.movesUsed = movesUsed
            self.movesBudget = movesBudget
            self.levelName = levelName
            self.worldName = worldName
        }
    }

    public var startedAt: Date
    public init(startedAt: Date) { self.startedAt = startedAt }
}

@available(iOS 16.2, *)
struct HenryActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HenryActivityAttributes.self) { context in
            // Lock-screen banner
            HStack(spacing: 12) {
                Text("🎮").font(.system(size: 34))
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.levelName)
                        .font(.headline).foregroundStyle(.white)
                    Text(context.state.worldName)
                        .font(.caption).foregroundStyle(.white.opacity(0.6))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(context.state.coinsCollected)/\(context.state.coinsTarget) coins")
                        .font(.system(size: 12, weight: .bold)).foregroundStyle(.yellow)
                    Text("\(context.state.movesUsed)/\(context.state.movesBudget) moves")
                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(.white.opacity(0.7))
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading)   { Text("🎮 " + context.state.levelName) }
                DynamicIslandExpandedRegion(.trailing)  { Text("\(context.state.coinsCollected)/\(context.state.coinsTarget) 🪙").font(.caption) }
                DynamicIslandExpandedRegion(.bottom)    { Text("\(context.state.movesUsed)/\(context.state.movesBudget) moves").font(.caption2).foregroundStyle(.white.opacity(0.7)) }
            } compactLeading: {
                Text("🎮")
            } compactTrailing: {
                Text("\(context.state.coinsCollected)/\(context.state.coinsTarget)")
                    .font(.caption2).bold()
            } minimal: {
                Text("🎮")
            }
        }
    }
}
