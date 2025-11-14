package com.streamio.aicomponents.renderkit

import PerfTextView
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.Dynamic
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

import android.graphics.Typeface
import android.os.Build
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.text.ReactFontManager
import kotlin.math.max

// ...rest

@ReactModule(name = "PerfText")
class PerfTextViewManager : SimpleViewManager<PerfTextView>() {

  override fun getName() = "PerfText"
  override fun createViewInstance(rc: ThemedReactContext) = PerfTextView(rc)

  @ReactProp(name = "text")
  fun setText(v: PerfTextView, text: String?) {
    v.setTextValue(text ?: "")
  }

  @ReactProp(name = "colorRanges")
  fun setColorRanges(v: PerfTextView, arr: ReadableArray?) {
    val out = mutableListOf<PerfTextView.ColorRange>()
    if (arr != null) {
      for (i in 0 until arr.size()) {
        val m = arr.getMap(i)
        val start = m!!.getInt("start")
        val end = m.getInt("end")
        val dyn: Dynamic = m.getDynamic("color")
        val color = when (dyn.type) {
          ReadableType.Number -> dyn.asInt()
          ReadableType.String -> ColorPropConverter.getColor(dyn.asString(), v.context)
          else -> 0xff000000.toInt()
        } ?: 0xff000000.toInt()
        out.add(PerfTextView.ColorRange(start, end, color))
      }
    }
    v.setColorRanges(out)
  }

  @ReactProp(name = "fontSize")
  fun setFontSize(v: PerfTextView, sizeSp: Double) {
    if (sizeSp > 0) v.textSize = sizeSp.toFloat()
  }


    @ReactProp(name = "lineHeight")
    fun setLineHeight(v: PerfTextView, height: Double) {
      val targetPx = PixelUtil.toPixelFromDIP(height.toFloat())
      if (height > 0) v.setLineSpacing(0f, targetPx / v.textSize);
//      if (height > 0) v.setLineHeight(height.toInt());
//      v.lineHeight
    }



  @ReactProp(name = "fontFamily")
  fun setFontFamily(v: PerfTextView, family: String?) {
    v.setFontFamilyCompat(family)
  }
}

