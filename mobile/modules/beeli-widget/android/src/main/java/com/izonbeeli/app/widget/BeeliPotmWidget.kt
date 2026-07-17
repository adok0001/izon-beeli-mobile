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

class BeeliPotmWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val json = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString("potm_content", null)
    val (languageId, text, translation) = if (json != null) {
      val obj = JSONObject(json)
      Triple(obj.optString("languageId", ""), obj.optString("text", "—"), obj.optString("translation", ""))
    } else {
      Triple("", "—", "Open Beeli to load")
    }

    val pendingIntent = if (languageId.isNotEmpty()) {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("izonbeelimobile://proverbs/$languageId")).apply {
        setPackage(ctx.packageName)
      }
      PendingIntent.getActivity(ctx, languageId.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE)
    } else {
      null
    }

    for (id in ids) {
      val views = RemoteViews(ctx.packageName, R.layout.widget_potm).apply {
        setTextViewText(R.id.potm_text, text)
        setTextViewText(R.id.potm_translation, translation)
        if (pendingIntent != null) setOnClickPendingIntent(R.id.potm_root, pendingIntent)
      }
      mgr.updateAppWidget(id, views)
    }
  }
}
