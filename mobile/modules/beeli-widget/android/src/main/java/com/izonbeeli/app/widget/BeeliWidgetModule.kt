package com.izonbeeli.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val PREFS_NAME = "BeeliWidgetPrefs"

class BeeliWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BeeliWidget")

    Function("writeWidgetContent") { key: String, json: String ->
      val ctx = appContext.reactContext ?: return@Function
      prefs(ctx).edit().putString(key, json).apply()
    }

    Function("reloadWidgetTimelines") {
      val ctx = appContext.reactContext ?: return@Function
      val mgr = AppWidgetManager.getInstance(ctx)
      listOf(
        BeeliWotdWidget::class.java,
        BeeliPotmWidget::class.java,
        BeeliSotwWidget::class.java,
      ).forEach { cls ->
        val ids = mgr.getAppWidgetIds(ComponentName(ctx, cls))
        if (ids.isNotEmpty()) {
          val intent = Intent(ctx, cls).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
          }
          ctx.sendBroadcast(intent)
        }
      }
    }
  }

  private fun prefs(ctx: Context): SharedPreferences =
    ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
