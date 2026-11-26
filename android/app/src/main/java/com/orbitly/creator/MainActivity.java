package com.orbitly.creator;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private static final int CREAM = Color.parseColor("#F2F0E8");

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);

    // Edge-to-edge (Android 15+) with cream system bars so the Figma home
    // background continues under the icons instead of a dark strip.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    getWindow().setStatusBarColor(CREAM);
    getWindow().setNavigationBarColor(CREAM);

    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (controller != null) {
      controller.setAppearanceLightStatusBars(true);
      controller.setAppearanceLightNavigationBars(true);
    }

    final View content = findViewById(android.R.id.content);
    if (content != null) {
      content.setBackgroundColor(CREAM);
      ViewCompat.setOnApplyWindowInsetsListener(
          content,
          (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
          });
      ViewCompat.requestApplyInsets(content);
    }
  }
}
