import WidgetKit
import SwiftUI

private let appGroupId = "group.com.izonbeeli.shared"

// MARK: - Shared helpers

private func readDefaults<T: Decodable>(_ key: String, as type: T.Type) -> T? {
  guard
    let raw = UserDefaults(suiteName: appGroupId)?.string(forKey: key),
    let data = raw.data(using: .utf8)
  else { return nil }
  return try? JSONDecoder().decode(T.self, from: data)
}

private struct WidgetColors {
  static let bg = Color(red: 0.05, green: 0.06, blue: 0.10)       // #0D0F1A
  static let gold = Color(red: 0.77, green: 0.53, blue: 0.16)     // #C4862A
  static let text = Color(red: 0.97, green: 0.95, blue: 0.91)     // #F7F2E8
  static let muted = Color(red: 0.70, green: 0.68, blue: 0.64)
}

private extension View {
  @ViewBuilder
  func widgetBackground(_ color: Color) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(color, for: .widget)
    } else {
      background(color)
    }
  }
}

// MARK: - Word of the Day

private struct WotdEntry: TimelineEntry {
  let date: Date
  let word: String
  let pronunciation: String?
  let english: String
}

private struct WotdCodable: Decodable {
  let word: String
  let pronunciation: String?
  let english: String
}

private struct WotdProvider: TimelineProvider {
  func placeholder(in context: Context) -> WotdEntry {
    WotdEntry(date: .now, word: "Ọkọ", pronunciation: "o-kò", english: "husband")
  }

  func getSnapshot(in context: Context, completion: @escaping (WotdEntry) -> Void) {
    completion(entry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WotdEntry>) -> Void) {
    let e = entry()
    let next = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
    completion(Timeline(entries: [e], policy: .after(next)))
  }

  private func entry() -> WotdEntry {
    if let c = readDefaults("wotd_content", as: WotdCodable.self) {
      return WotdEntry(date: .now, word: c.word, pronunciation: c.pronunciation, english: c.english)
    }
    return WotdEntry(date: .now, word: "—", pronunciation: nil, english: "Open Beeli to load")
  }
}

private struct WotdWidgetView: View {
  let entry: WotdEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label("Word of the Day", systemImage: "star.fill")
        .font(.system(size: 10, weight: .semibold))
        .foregroundColor(WidgetColors.gold)
      Spacer()
      Text(entry.word)
        .font(.system(size: 26, weight: .bold))
        .foregroundColor(WidgetColors.text)
      if let pron = entry.pronunciation {
        Text("/\(pron)/")
          .font(.system(size: 11))
          .italic()
          .foregroundColor(WidgetColors.muted)
      }
      Text(entry.english)
        .font(.system(size: 13))
        .foregroundColor(WidgetColors.text.opacity(0.85))
        .lineLimit(2)
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetBackground(WidgetColors.bg)
  }
}

struct BeeliWotdWidget: Widget {
  let kind = "BeeliWotd"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: WotdProvider()) { entry in
      WotdWidgetView(entry: entry)
    }
    .configurationDisplayName("Word of the Day")
    .description("Today's word from your Beeli language.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Proverb of the Month

private struct PotmEntry: TimelineEntry {
  let date: Date
  let text: String
  let translation: String
}

private struct PotmCodable: Decodable {
  let text: String
  let translation: String
}

private struct PotmProvider: TimelineProvider {
  func placeholder(in context: Context) -> PotmEntry {
    PotmEntry(date: .now, text: "Ọmọ tó bá fẹ́ jẹun tán kò gbọdọ̀ jẹ ọbẹ̀ mọ́", translation: "A child that wants to finish eating must not eat soup")
  }

  func getSnapshot(in context: Context, completion: @escaping (PotmEntry) -> Void) {
    completion(entry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PotmEntry>) -> Void) {
    let e = entry()
    // Refresh on the 1st of next month
    var comps = Calendar.current.dateComponents([.year, .month], from: Date())
    comps.month! += 1
    comps.day = 1
    let next = Calendar.current.date(from: comps) ?? Date().addingTimeInterval(86400 * 30)
    completion(Timeline(entries: [e], policy: .after(next)))
  }

  private func entry() -> PotmEntry {
    if let c = readDefaults("potm_content", as: PotmCodable.self) {
      return PotmEntry(date: .now, text: c.text, translation: c.translation)
    }
    return PotmEntry(date: .now, text: "—", translation: "Open Beeli to load")
  }
}

private struct PotmWidgetView: View {
  let entry: PotmEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label("Proverb of the Month", systemImage: "quote.opening")
        .font(.system(size: 10, weight: .semibold))
        .foregroundColor(WidgetColors.gold)
      Spacer()
      Text(entry.text)
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(WidgetColors.text)
        .lineLimit(3)
      Text(entry.translation)
        .font(.system(size: 11))
        .foregroundColor(WidgetColors.muted)
        .lineLimit(2)
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetBackground(WidgetColors.bg)
  }
}

struct BeeliPotmWidget: Widget {
  let kind = "BeeliPotm"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PotmProvider()) { entry in
      PotmWidgetView(entry: entry)
    }
    .configurationDisplayName("Proverb of the Month")
    .description("This month's proverb from your Beeli language.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Song of the Week

private struct SotwEntry: TimelineEntry {
  let date: Date
  let title: String
}

private struct SotwCodable: Decodable {
  let title: String
}

private struct SotwProvider: TimelineProvider {
  func placeholder(in context: Context) -> SotwEntry {
    SotwEntry(date: .now, title: "Iye Mi")
  }

  func getSnapshot(in context: Context, completion: @escaping (SotwEntry) -> Void) {
    completion(entry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SotwEntry>) -> Void) {
    let e = entry()
    // Refresh next Monday
    var comps = Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
    comps.weekOfYear! += 1
    comps.weekday = 2 // Monday
    let next = Calendar.current.date(from: comps) ?? Date().addingTimeInterval(86400 * 7)
    completion(Timeline(entries: [e], policy: .after(next)))
  }

  private func entry() -> SotwEntry {
    if let c = readDefaults("sotw_content", as: SotwCodable.self) {
      return SotwEntry(date: .now, title: c.title)
    }
    return SotwEntry(date: .now, title: "Open Beeli to load")
  }
}

private struct SotwWidgetView: View {
  let entry: SotwEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label("Song of the Week", systemImage: "music.note")
        .font(.system(size: 10, weight: .semibold))
        .foregroundColor(WidgetColors.gold)
      Spacer()
      Image(systemName: "play.circle.fill")
        .font(.system(size: 28))
        .foregroundColor(WidgetColors.gold)
      Text(entry.title)
        .font(.system(size: 14, weight: .semibold))
        .foregroundColor(WidgetColors.text)
        .lineLimit(2)
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetBackground(WidgetColors.bg)
  }
}

struct BeeliSotwWidget: Widget {
  let kind = "BeeliSotw"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SotwProvider()) { entry in
      SotwWidgetView(entry: entry)
    }
    .configurationDisplayName("Song of the Week")
    .description("This week's song from your Beeli language.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
