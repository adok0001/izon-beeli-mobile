import ExpoModulesCore
import WidgetKit

private let appGroupId = "group.com.izonbeeli.app"

public class BeeliWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BeeliWidget")

    Function("writeWidgetContent") { (key: String, json: String) in
      let defaults = UserDefaults(suiteName: appGroupId)
      defaults?.set(json, forKey: key)
    }

    Function("reloadWidgetTimelines") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
