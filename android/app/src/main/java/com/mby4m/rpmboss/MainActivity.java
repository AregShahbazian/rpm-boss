package com.mby4m.rpmboss;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(RawAudioPlugin.class);
        super.onCreate(savedInstanceState);

        // The window already reaches under both system bars, so the app's own
        // background is what shows there. Android otherwise lays a translucent
        // scrim over the navigation bar — the grey strip beside the buttons —
        // on the assumption that it is sitting on content it has to stay
        // legible against. It is sitting on a flat background, so it is not.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }
    }
}
