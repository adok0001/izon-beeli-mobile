package com.izonbeeli.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.izonbeeli.app.R
import org.json.JSONObject

class BeeliWotdWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("wotd_content", null)
    val (word, english) = if (json != null) {
      val obj = JSONObject(json)
      Pair(obj.optString("word", "—"), obj.optString("english", ""))
    } else {
      Pair("—", "Open Beeli to load")
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_wotd).apply {
        setTextViewText(R.id.wotd_word, word)
        setTextViewText(R.id.wotd_english, english)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
