package com.izonbeeli.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.izonbeeli.app.R
import org.json.JSONObject

class BeeliPotmWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("potm_content", null)
    val (text, translation) = if (json != null) {
      val obj = JSONObject(json)
      Pair(obj.optString("text", "—"), obj.optString("translation", ""))
    } else {
      Pair("—", "Open Beeli to load")
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_potm).apply {
        setTextViewText(R.id.potm_text, text)
        setTextViewText(R.id.potm_translation, translation)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
