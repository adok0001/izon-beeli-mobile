package com.izonbeeli.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.izonbeeli.app.R
import org.json.JSONObject

class BeeliSotwWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("sotw_content", null)
    val title = if (json != null) {
      JSONObject(json).optString("title", "—")
    } else {
      "Open Beeli to load"
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_sotw).apply {
        setTextViewText(R.id.sotw_title, title)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
