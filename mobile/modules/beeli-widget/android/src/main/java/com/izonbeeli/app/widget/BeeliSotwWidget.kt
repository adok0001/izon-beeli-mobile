package com.izonbeeli.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.izonbeeli.app.R
import org.json.JSONObject

class BeeliSotwWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("sotw_content", null)
    val (lessonId, title) = if (json != null) {
      val obj = JSONObject(json)
      Pair(obj.optString("id", ""), obj.optString("title", "—"))
    } else {
      Pair("", "Open Beeli to load")
    }

    val pendingIntent = if (lessonId.isNotEmpty()) {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("izonbeelimobile://lesson/$lessonId")).apply {
        setPackage(ctx.packageName)
      }
      PendingIntent.getActivity(ctx, lessonId.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE)
    } else {
      null
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_sotw).apply {
        setTextViewText(R.id.sotw_title, title)
        if (pendingIntent != null) setOnClickPendingIntent(R.id.sotw_root, pendingIntent)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
