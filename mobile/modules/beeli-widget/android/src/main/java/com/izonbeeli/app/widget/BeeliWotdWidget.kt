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

class BeeliWotdWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("wotd_content", null)
    val (entryId, word, english) = if (json != null) {
      val obj = JSONObject(json)
      Triple(obj.optString("id", ""), obj.optString("word", "—"), obj.optString("english", ""))
    } else {
      Triple("", "—", "Open Beeli to load")
    }

    val pendingIntent = if (entryId.isNotEmpty()) {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("izonbeelimobile://word/$entryId")).apply {
        setPackage(ctx.packageName)
      }
      PendingIntent.getActivity(ctx, entryId.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE)
    } else {
      null
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_wotd).apply {
        setTextViewText(R.id.wotd_word, word)
        setTextViewText(R.id.wotd_english, english)
        if (pendingIntent != null) setOnClickPendingIntent(R.id.wotd_root, pendingIntent)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
