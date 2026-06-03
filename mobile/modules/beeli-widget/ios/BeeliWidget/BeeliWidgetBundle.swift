import WidgetKit
import SwiftUI

@main
struct BeeliWidgetBundle: WidgetBundle {
  var body: some Widget {
    BeeliWotdWidget()
    BeeliPotmWidget()
    BeeliSotwWidget()
  }
}
